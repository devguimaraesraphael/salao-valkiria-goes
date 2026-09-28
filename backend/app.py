from datetime import datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import SALAO, close_db, get_db, init_db

app = Flask(__name__)
CORS(app)
app.teardown_appcontext(close_db)


def erro(mensagem, status=400):
    return jsonify({"erro": mensagem}), status


def texto(dados, campo):
    return (dados.get(campo) or "").strip()


def intervalo(data, horario, duracao_min):
    inicio = datetime.strptime(f"{data} {horario}", "%Y-%m-%d %H:%M")
    return inicio, inicio + timedelta(minutes=duracao_min)


@app.get("/api/vitrine")
def vitrine():
    db = get_db()
    servicos = db.execute(
        "SELECT id, nome, preco, duracao_min FROM servicos ORDER BY nome"
    ).fetchall()
    db.execute(
        "UPDATE metricas SET valor = valor + 1 WHERE chave = 'acessos_vitrine'"
    )
    db.commit()
    return jsonify(
        {
            **SALAO,
            "whatsapp_link": f"https://wa.me/{SALAO['whatsapp_numero']}",
            "servicos": [dict(linha) for linha in servicos],
        }
    )


@app.get("/api/indicadores")
def indicadores():
    db = get_db()
    total_clientes = db.execute("SELECT COUNT(*) AS n FROM clientes").fetchone()["n"]
    total_agendamentos = db.execute("SELECT COUNT(*) AS n FROM agendamentos").fetchone()["n"]
    acessos_vitrine = db.execute(
        "SELECT valor FROM metricas WHERE chave = 'acessos_vitrine'"
    ).fetchone()["valor"]
    produtos_abaixo_minimo = db.execute(
        "SELECT COUNT(*) AS n FROM produtos WHERE quantidade < quantidade_minima"
    ).fetchone()["n"]
    return jsonify(
        {
            "total_clientes": total_clientes,
            "total_agendamentos": total_agendamentos,
            "acessos_vitrine": acessos_vitrine,
            "produtos_abaixo_minimo": produtos_abaixo_minimo,
        }
    )


@app.get("/api/servicos")
def listar_servicos():
    linhas = get_db().execute(
        "SELECT id, nome, preco, duracao_min FROM servicos ORDER BY nome"
    ).fetchall()
    return jsonify([dict(linha) for linha in linhas])


@app.get("/api/clientes")
def listar_clientes():
    busca = request.args.get("busca", "").strip()
    sql = "SELECT id, nome, telefone, observacoes FROM clientes"
    parametros = ()
    if busca:
        sql += " WHERE nome LIKE ? OR telefone LIKE ?"
        parametros = (f"%{busca}%", f"%{busca}%")
    sql += " ORDER BY nome COLLATE NOCASE"
    return jsonify([dict(linha) for linha in get_db().execute(sql, parametros).fetchall()])


@app.post("/api/clientes")
def criar_cliente():
    dados = request.get_json(silent=True) or {}
    nome = texto(dados, "nome")
    telefone = texto(dados, "telefone")
    if not nome or not telefone:
        return erro("Nome e telefone são obrigatórios.")

    db = get_db()
    duplicado = db.execute("SELECT id FROM clientes WHERE telefone = ?", (telefone,)).fetchone()
    if duplicado:
        return erro("Já existe um cliente cadastrado com esse telefone.", 409)

    cursor = db.execute(
        "INSERT INTO clientes (nome, telefone, observacoes) VALUES (?, ?, ?)",
        (nome, telefone, texto(dados, "observacoes")),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201


@app.put("/api/clientes/<int:cliente_id>")
def atualizar_cliente(cliente_id):
    dados = request.get_json(silent=True) or {}
    nome = texto(dados, "nome")
    telefone = texto(dados, "telefone")
    if not nome or not telefone:
        return erro("Nome e telefone são obrigatórios.")

    db = get_db()
    if db.execute("SELECT id FROM clientes WHERE id = ?", (cliente_id,)).fetchone() is None:
        return erro("Cliente não encontrado.", 404)

    duplicado = db.execute(
        "SELECT id FROM clientes WHERE telefone = ? AND id <> ?", (telefone, cliente_id)
    ).fetchone()
    if duplicado:
        return erro("Já existe outro cliente com esse telefone.", 409)

    db.execute(
        "UPDATE clientes SET nome = ?, telefone = ?, observacoes = ? WHERE id = ?",
        (nome, telefone, texto(dados, "observacoes"), cliente_id),
    )
    db.commit()
    return jsonify({"id": cliente_id})


@app.delete("/api/clientes/<int:cliente_id>")
def remover_cliente(cliente_id):
    db = get_db()
    if db.execute("SELECT id FROM clientes WHERE id = ?", (cliente_id,)).fetchone() is None:
        return erro("Cliente não encontrado.", 404)
    db.execute("DELETE FROM clientes WHERE id = ?", (cliente_id,))
    db.commit()
    return "", 204


@app.get("/api/agendamentos")
def listar_agendamentos():
    data = request.args.get("data", "").strip()
    sql = """
        SELECT agendamentos.id, agendamentos.data, agendamentos.horario,
               clientes.id AS cliente_id, clientes.nome AS cliente_nome,
               clientes.telefone AS cliente_telefone,
               servicos.nome AS servico_nome, servicos.preco, servicos.duracao_min
        FROM agendamentos
        JOIN clientes ON clientes.id = agendamentos.cliente_id
        JOIN servicos ON servicos.id = agendamentos.servico_id
    """
    parametros = ()
    if data:
        sql += " WHERE agendamentos.data = ?"
        parametros = (data,)
    sql += " ORDER BY agendamentos.data, agendamentos.horario"
    return jsonify([dict(linha) for linha in get_db().execute(sql, parametros).fetchall()])


@app.post("/api/agendamentos")
def criar_agendamento():
    dados = request.get_json(silent=True) or {}
    cliente_id = dados.get("cliente_id")
    servico_id = dados.get("servico_id")
    data = texto(dados, "data")
    horario = texto(dados, "horario")

    if not cliente_id or not servico_id or not data or not horario:
        return erro("Cliente, serviço, data e horário são obrigatórios.")

    db = get_db()
    if db.execute("SELECT id FROM clientes WHERE id = ?", (cliente_id,)).fetchone() is None:
        return erro("Cliente não encontrado.", 404)

    servico = db.execute(
        "SELECT id, nome, duracao_min FROM servicos WHERE id = ?", (servico_id,)
    ).fetchone()
    if servico is None:
        return erro("Serviço não encontrado.", 404)

    try:
        inicio, fim = intervalo(data, horario, servico["duracao_min"])
    except ValueError:
        return erro("Data ou horário em formato inválido.")

    agendados = db.execute(
        """
        SELECT agendamentos.horario, clientes.nome AS cliente_nome,
               servicos.nome AS servico_nome, servicos.duracao_min
        FROM agendamentos
        JOIN clientes ON clientes.id = agendamentos.cliente_id
        JOIN servicos ON servicos.id = agendamentos.servico_id
        WHERE agendamentos.data = ?
        """,
        (data,),
    ).fetchall()

    for existente in agendados:
        outro_inicio, outro_fim = intervalo(data, existente["horario"], existente["duracao_min"])
        if inicio < outro_fim and outro_inicio < fim:
            return erro(
                f"Conflito de horário: {existente['cliente_nome']} já tem "
                f"{existente['servico_nome']} às {existente['horario']}.",
                409,
            )

    cursor = db.execute(
        "INSERT INTO agendamentos (cliente_id, servico_id, data, horario) VALUES (?, ?, ?, ?)",
        (cliente_id, servico_id, data, horario),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid, "termina_em": fim.strftime("%H:%M")}), 201


@app.delete("/api/agendamentos/<int:agendamento_id>")
def remover_agendamento(agendamento_id):
    db = get_db()
    if db.execute("SELECT id FROM agendamentos WHERE id = ?", (agendamento_id,)).fetchone() is None:
        return erro("Agendamento não encontrado.", 404)
    db.execute("DELETE FROM agendamentos WHERE id = ?", (agendamento_id,))
    db.commit()
    return "", 204


@app.get("/api/produtos")
def listar_produtos():
    linhas = get_db().execute(
        "SELECT id, nome, unidade, quantidade, quantidade_minima FROM produtos ORDER BY nome COLLATE NOCASE"
    ).fetchall()
    return jsonify([dict(linha) for linha in linhas])


@app.post("/api/produtos")
def criar_produto():
    dados = request.get_json(silent=True) or {}
    nome = texto(dados, "nome")
    unidade = texto(dados, "unidade") or "un"
    quantidade_minima = dados.get("quantidade_minima") or 0
    if not nome:
        return erro("Nome é obrigatório.")

    db = get_db()
    duplicado = db.execute("SELECT id FROM produtos WHERE nome = ?", (nome,)).fetchone()
    if duplicado:
        return erro("Já existe um produto cadastrado com esse nome.", 409)

    cursor = db.execute(
        "INSERT INTO produtos (nome, unidade, quantidade, quantidade_minima) VALUES (?, ?, 0, ?)",
        (nome, unidade, quantidade_minima),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201


@app.put("/api/produtos/<int:produto_id>")
def atualizar_produto(produto_id):
    dados = request.get_json(silent=True) or {}
    nome = texto(dados, "nome")
    unidade = texto(dados, "unidade") or "un"
    quantidade_minima = dados.get("quantidade_minima") or 0
    if not nome:
        return erro("Nome é obrigatório.")

    db = get_db()
    if db.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,)).fetchone() is None:
        return erro("Produto não encontrado.", 404)

    duplicado = db.execute(
        "SELECT id FROM produtos WHERE nome = ? AND id <> ?", (nome, produto_id)
    ).fetchone()
    if duplicado:
        return erro("Já existe outro produto com esse nome.", 409)

    db.execute(
        "UPDATE produtos SET nome = ?, unidade = ?, quantidade_minima = ? WHERE id = ?",
        (nome, unidade, quantidade_minima, produto_id),
    )
    db.commit()
    return jsonify({"id": produto_id})


@app.delete("/api/produtos/<int:produto_id>")
def remover_produto(produto_id):
    db = get_db()
    if db.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,)).fetchone() is None:
        return erro("Produto não encontrado.", 404)
    db.execute("DELETE FROM produtos WHERE id = ?", (produto_id,))
    db.commit()
    return "", 204


@app.get("/api/produtos/<int:produto_id>/movimentos")
def listar_movimentos(produto_id):
    db = get_db()
    if db.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,)).fetchone() is None:
        return erro("Produto não encontrado.", 404)
    linhas = db.execute(
        """
        SELECT id, tipo, quantidade, motivo, criado_em FROM movimentos_estoque
        WHERE produto_id = ? ORDER BY criado_em DESC, id DESC
        """,
        (produto_id,),
    ).fetchall()
    return jsonify([dict(linha) for linha in linhas])


@app.post("/api/produtos/<int:produto_id>/movimentos")
def criar_movimento(produto_id):
    dados = request.get_json(silent=True) or {}
    tipo = texto(dados, "tipo")
    motivo = texto(dados, "motivo")
    try:
        quantidade = float(dados.get("quantidade"))
    except (TypeError, ValueError):
        return erro("Quantidade inválida.")

    if tipo not in ("entrada", "saida"):
        return erro("Tipo deve ser 'entrada' ou 'saida'.")
    if quantidade <= 0:
        return erro("Quantidade deve ser maior que zero.")

    db = get_db()
    produto = db.execute(
        "SELECT id, quantidade FROM produtos WHERE id = ?", (produto_id,)
    ).fetchone()
    if produto is None:
        return erro("Produto não encontrado.", 404)

    if tipo == "saida" and quantidade > produto["quantidade"]:
        return erro("Quantidade em estoque insuficiente para essa saída.", 409)

    nova_quantidade = (
        produto["quantidade"] + quantidade if tipo == "entrada" else produto["quantidade"] - quantidade
    )
    db.execute("UPDATE produtos SET quantidade = ? WHERE id = ?", (nova_quantidade, produto_id))
    cursor = db.execute(
        "INSERT INTO movimentos_estoque (produto_id, tipo, quantidade, motivo) VALUES (?, ?, ?, ?)",
        (produto_id, tipo, quantidade, motivo),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid, "quantidade_atual": nova_quantidade}), 201


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
