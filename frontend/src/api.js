async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });

  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.erro || "Não foi possível completar a operação.");
  }
  return corpo;
}

export const api = {
  vitrine: () => requisitar("/api/vitrine"),
  servicos: () => requisitar("/api/servicos"),

  listarClientes: (busca = "") =>
    requisitar(`/api/clientes${busca ? `?busca=${encodeURIComponent(busca)}` : ""}`),
  criarCliente: (cliente) =>
    requisitar("/api/clientes", { method: "POST", body: JSON.stringify(cliente) }),
  atualizarCliente: (id, cliente) =>
    requisitar(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(cliente) }),
  removerCliente: (id) => requisitar(`/api/clientes/${id}`, { method: "DELETE" }),

  listarAgendamentos: (data = "") =>
    requisitar(`/api/agendamentos${data ? `?data=${data}` : ""}`),
  criarAgendamento: (agendamento) =>
    requisitar("/api/agendamentos", { method: "POST", body: JSON.stringify(agendamento) }),
  removerAgendamento: (id) => requisitar(`/api/agendamentos/${id}`, { method: "DELETE" }),
};

export function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas && resto) return `${horas}h${resto}`;
  if (horas) return `${horas}h`;
  return `${resto} min`;
}
