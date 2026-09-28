import { useEffect, useState } from "react";
import { api } from "../api.js";

const FORMULARIO_VAZIO = { nome: "", unidade: "un", quantidade_minima: 0 };
const MOVIMENTO_VAZIO = { tipo: "entrada", quantidade: "", motivo: "" };

export default function Estoque({ aoAvisar }) {
  const [produtos, setProdutos] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [editando, setEditando] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);
  const [erro, setErro] = useState("");

  const [produtoMovimento, setProdutoMovimento] = useState(null);
  const [movimento, setMovimento] = useState(MOVIMENTO_VAZIO);
  const [erroMovimento, setErroMovimento] = useState("");

  async function recarregar() {
    setProdutos(await api.listarProdutos());
  }

  useEffect(() => {
    recarregar().catch(() => aoAvisar({ tipo: "erro", texto: "Servidor indisponível." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function cancelarEdicao() {
    setEditando(null);
    setFormulario(FORMULARIO_VAZIO);
    setErro("");
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro("");
    try {
      if (editando) {
        await api.atualizarProduto(editando, formulario);
        aoAvisar({ tipo: "sucesso", texto: "Produto atualizado com sucesso." });
      } else {
        await api.criarProduto(formulario);
        aoAvisar({ tipo: "sucesso", texto: "Produto cadastrado com sucesso." });
      }
      cancelarEdicao();
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function editar(produto) {
    setEditando(produto.id);
    setFormulario({
      nome: produto.nome,
      unidade: produto.unidade,
      quantidade_minima: produto.quantidade_minima,
    });
  }

  async function excluir(id) {
    try {
      await api.removerProduto(id);
      setConfirmandoExclusao(null);
      if (editando === id) cancelarEdicao();
      aoAvisar({ tipo: "sucesso", texto: "Produto removido." });
      await recarregar();
    } catch (e) {
      aoAvisar({ tipo: "erro", texto: e.message });
    }
  }

  function abrirMovimento(produto) {
    setProdutoMovimento(produto);
    setMovimento(MOVIMENTO_VAZIO);
    setErroMovimento("");
  }

  async function registrarMovimento(evento) {
    evento.preventDefault();
    setErroMovimento("");
    try {
      await api.registrarMovimento(produtoMovimento.id, movimento);
      aoAvisar({ tipo: "sucesso", texto: "Movimentação registrada." });
      setProdutoMovimento(null);
      await recarregar();
    } catch (e) {
      setErroMovimento(e.message);
    }
  }

  return (
    <section className="cartao">
      <div className="cabecalho-secao">
        <h2>Estoque</h2>
        <span className="contador">{produtos.length} produtos</span>
      </div>

      <form className="formulario" onSubmit={salvar}>
        <div className="linha">
          <label>
            Produto
            <input
              value={formulario.nome}
              onChange={(e) => alterar("nome", e.target.value)}
              placeholder="Ex.: Shampoo 1L"
              required
            />
          </label>
          <label>
            Unidade
            <input
              value={formulario.unidade}
              onChange={(e) => alterar("unidade", e.target.value)}
              placeholder="un, ml, kg…"
              required
            />
          </label>
          <label>
            Estoque mínimo
            <input
              type="number"
              min="0"
              step="0.01"
              value={formulario.quantidade_minima}
              onChange={(e) => alterar("quantidade_minima", Number(e.target.value))}
              required
            />
          </label>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="acoes-formulario">
          <button type="submit" className="primario">
            {editando ? "Salvar alterações" : "Cadastrar produto"}
          </button>
          {editando && (
            <button type="button" className="secundario" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {produtos.length === 0 ? (
        <p className="vazio">Nenhum produto cadastrado ainda.</p>
      ) : (
        <table className="lista">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Mínimo</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => {
              const abaixoMinimo = produto.quantidade < produto.quantidade_minima;
              return (
                <tr key={produto.id} className={abaixoMinimo ? "estoque-baixo" : undefined}>
                  <td>{produto.nome}</td>
                  <td>
                    {produto.quantidade} {produto.unidade}
                    {abaixoMinimo && <span className="etiqueta-alerta">repor</span>}
                  </td>
                  <td>
                    {produto.quantidade_minima} {produto.unidade}
                  </td>
                  <td className="acoes">
                    {confirmandoExclusao === produto.id ? (
                      <>
                        <button type="button" className="perigo" onClick={() => excluir(produto.id)}>
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="texto"
                          onClick={() => setConfirmandoExclusao(null)}
                        >
                          Não
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="texto" onClick={() => abrirMovimento(produto)}>
                          Movimentar
                        </button>
                        <button type="button" className="texto" onClick={() => editar(produto)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="texto perigo-texto"
                          onClick={() => setConfirmandoExclusao(produto.id)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {produtoMovimento && (
        <form className="formulario" onSubmit={registrarMovimento} style={{ marginTop: 20 }}>
          <div className="cabecalho-secao">
            <h2>Movimentar: {produtoMovimento.nome}</h2>
          </div>
          <div className="linha">
            <label>
              Tipo
              <select
                value={movimento.tipo}
                onChange={(e) => setMovimento((atual) => ({ ...atual, tipo: e.target.value }))}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={movimento.quantidade}
                onChange={(e) =>
                  setMovimento((atual) => ({ ...atual, quantidade: e.target.value }))
                }
                required
              />
            </label>
          </div>
          <label>
            Motivo (opcional)
            <input
              value={movimento.motivo}
              onChange={(e) => setMovimento((atual) => ({ ...atual, motivo: e.target.value }))}
              placeholder="Ex.: compra de reposição, uso em atendimento…"
            />
          </label>

          {erroMovimento && <p className="mensagem-erro">{erroMovimento}</p>}

          <div className="acoes-formulario">
            <button type="submit" className="primario">
              Registrar movimentação
            </button>
            <button type="button" className="secundario" onClick={() => setProdutoMovimento(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
