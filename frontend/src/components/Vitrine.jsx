import { useEffect, useState } from "react";
import { api, formatarDuracao, formatarPreco } from "../api.js";

export default function Vitrine() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.vitrine().then(setDados).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <p className="vazio">{erro}</p>;
  if (!dados) return <p className="vazio">Carregando informações do salão…</p>;

  return (
    <section className="cartao vitrine">
      <p className="vitrine-descricao">{dados.descricao}</p>

      <dl className="vitrine-info">
        <div>
          <dt>Endereço</dt>
          <dd>{dados.endereco}</dd>
        </div>
        <div>
          <dt>Atendimento</dt>
          <dd>{dados.horario_funcionamento}</dd>
        </div>
      </dl>

      <h2>Nossos serviços</h2>
      <ul className="servicos">
        {dados.servicos.map((servico) => (
          <li key={servico.id}>
            <div>
              <strong>{servico.nome}</strong>
              <span className="duracao">{formatarDuracao(servico.duracao_min)}</span>
            </div>
            <span className="preco">{formatarPreco(servico.preco)}</span>
          </li>
        ))}
      </ul>

      <a
        className="botao-whatsapp"
        href={dados.whatsapp_link}
        target="_blank"
        rel="noreferrer"
      >
        Agendar pelo WhatsApp
      </a>
    </section>
  );
}
