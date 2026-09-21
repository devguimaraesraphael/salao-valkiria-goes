import { useCallback, useEffect, useState } from "react";
import { api, formatarData, formatarDuracao, formatarPreco } from "../api.js";

const FORMULARIO_VAZIO = { cliente_id: "", servico_id: "", data: "", horario: "" };

export default function Agenda({ clientes, servicos, aoAvisar }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [filtroData, setFiltroData] = useState("");
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setAgendamentos(await api.listarAgendamentos(filtroData));
  }, [filtroData]);

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, [carregar]);

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function agendar(evento) {
    evento.preventDefault();
    setErro("");
    try {
      const criado = await api.criarAgendamento({
        ...formulario,
        cliente_id: Number(formulario.cliente_id),
        servico_id: Number(formulario.servico_id),
      });
      setFormulario(FORMULARIO_VAZIO);
      aoAvisar({
        tipo: "sucesso",
        texto: `Agendamento criado. Término previsto às ${criado.termina_em}.`,
      });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function cancelar(id) {
    try {
      await api.removerAgendamento(id);
      setConfirmandoCancelamento(null);
      aoAvisar({ tipo: "sucesso", texto: "Agendamento cancelado." });
      await carregar();
    } catch (e) {
      aoAvisar({ tipo: "erro", texto: e.message });
    }
  }

  const faturamentoPrevisto = agendamentos.reduce((total, item) => total + item.preco, 0);

  return (
    <section className="cartao">
      <div className="cabecalho-secao">
        <h2>Agenda</h2>
        <span className="contador">
          {agendamentos.length} agendamento{agendamentos.length === 1 ? "" : "s"}
        </span>
      </div>

      {clientes.length === 0 ? (
        <p className="vazio">Cadastre um cliente antes de criar um agendamento.</p>
      ) : (
        <form className="formulario" onSubmit={agendar}>
          <div className="linha">
            <label>
              Cliente
              <select
                value={formulario.cliente_id}
                onChange={(e) => alterar("cliente_id", e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Serviço
              <select
                value={formulario.servico_id}
                onChange={(e) => alterar("servico_id", e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {servicos.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} — {formatarDuracao(servico.duracao_min)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="linha">
            <label>
              Data
              <input
                type="date"
                value={formulario.data}
                onChange={(e) => alterar("data", e.target.value)}
                required
              />
            </label>
            <label>
              Horário
              <input
                type="time"
                value={formulario.horario}
                onChange={(e) => alterar("horario", e.target.value)}
                required
              />
            </label>
          </div>

          {erro && <p className="mensagem-erro">{erro}</p>}

          <div className="acoes-formulario">
            <button type="submit" className="primario">
              Agendar
            </button>
          </div>
        </form>
      )}

      <div className="filtro">
        <label>
          Filtrar por data
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
        </label>
        {filtroData && (
          <button type="button" className="texto" onClick={() => setFiltroData("")}>
            Limpar filtro
          </button>
        )}
      </div>

      {agendamentos.length === 0 ? (
        <p className="vazio">
          {filtroData
            ? "Nenhum agendamento para a data selecionada."
            : "Nenhum agendamento registrado ainda."}
        </p>
      ) : (
        <>
          <table className="lista">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Valor</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((item) => (
                <tr key={item.id}>
                  <td>{formatarData(item.data)}</td>
                  <td>{item.horario}</td>
                  <td>{item.cliente_nome}</td>
                  <td>{item.servico_nome}</td>
                  <td>{formatarPreco(item.preco)}</td>
                  <td className="acoes">
                    {confirmandoCancelamento === item.id ? (
                      <>
                        <button type="button" className="perigo" onClick={() => cancelar(item.id)}>
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="texto"
                          onClick={() => setConfirmandoCancelamento(null)}
                        >
                          Não
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="texto perigo-texto"
                        onClick={() => setConfirmandoCancelamento(item.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="total">
            Faturamento previsto: <strong>{formatarPreco(faturamentoPrevisto)}</strong>
          </p>
        </>
      )}
    </section>
  );
}
