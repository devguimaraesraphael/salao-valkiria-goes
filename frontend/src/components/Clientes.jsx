import { useEffect, useState } from "react";
import { api } from "../api.js";

const FORMULARIO_VAZIO = { nome: "", telefone: "", observacoes: "" };

export default function Clientes({ clientes, aoMudar, aoAvisar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [editando, setEditando] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);
  const [busca, setBusca] = useState("");
  const [visiveis, setVisiveis] = useState(clientes);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!busca.trim()) {
      setVisiveis(clientes);
      return;
    }
    const termo = busca.trim().toLowerCase();
    setVisiveis(
      clientes.filter(
        (cliente) =>
          cliente.nome.toLowerCase().includes(termo) || cliente.telefone.includes(termo)
      )
    );
  }, [busca, clientes]);

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
        await api.atualizarCliente(editando, formulario);
        aoAvisar({ tipo: "sucesso", texto: "Cliente atualizado com sucesso." });
      } else {
        await api.criarCliente(formulario);
        aoAvisar({ tipo: "sucesso", texto: "Cliente cadastrado com sucesso." });
      }
      cancelarEdicao();
      await aoMudar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function editar(cliente) {
    setEditando(cliente.id);
    setFormulario({
      nome: cliente.nome,
      telefone: cliente.telefone,
      observacoes: cliente.observacoes || "",
    });
  }

  async function excluir(id) {
    try {
      await api.removerCliente(id);
      setConfirmandoExclusao(null);
      if (editando === id) cancelarEdicao();
      aoAvisar({ tipo: "sucesso", texto: "Cliente removido." });
      await aoMudar();
    } catch (e) {
      aoAvisar({ tipo: "erro", texto: e.message });
    }
  }

  return (
    <section className="cartao">
      <div className="cabecalho-secao">
        <h2>Clientes</h2>
        <span className="contador">{clientes.length} cadastrados</span>
      </div>

      <form className="formulario" onSubmit={salvar}>
        <div className="linha">
          <label>
            Nome
            <input
              value={formulario.nome}
              onChange={(e) => alterar("nome", e.target.value)}
              placeholder="Ex.: Maria Oliveira"
              required
            />
          </label>
          <label>
            Telefone
            <input
              value={formulario.telefone}
              onChange={(e) => alterar("telefone", e.target.value)}
              placeholder="Ex.: (21) 99999-0000"
              required
            />
          </label>
        </div>
        <label>
          Observações
          <input
            value={formulario.observacoes}
            onChange={(e) => alterar("observacoes", e.target.value)}
            placeholder="Preferências, alergias, histórico…"
          />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="acoes-formulario">
          <button type="submit" className="primario">
            {editando ? "Salvar alterações" : "Cadastrar cliente"}
          </button>
          {editando && (
            <button type="button" className="secundario" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <input
        className="busca"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou telefone"
      />

      {visiveis.length === 0 ? (
        <p className="vazio">
          {clientes.length === 0
            ? "Nenhum cliente cadastrado ainda."
            : "Nenhum cliente encontrado para essa busca."}
        </p>
      ) : (
        <table className="lista">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Observações</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visiveis.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome}</td>
                <td>{cliente.telefone}</td>
                <td className="observacoes">{cliente.observacoes || "—"}</td>
                <td className="acoes">
                  {confirmandoExclusao === cliente.id ? (
                    <>
                      <button type="button" className="perigo" onClick={() => excluir(cliente.id)}>
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
                      <button type="button" className="texto" onClick={() => editar(cliente)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="texto perigo-texto"
                        onClick={() => setConfirmandoExclusao(cliente.id)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
