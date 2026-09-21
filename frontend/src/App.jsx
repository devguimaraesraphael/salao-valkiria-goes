import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import Vitrine from "./components/Vitrine.jsx";
import Clientes from "./components/Clientes.jsx";
import Agenda from "./components/Agenda.jsx";
import Aviso from "./components/Aviso.jsx";

const ABAS = [
  { chave: "vitrine", rotulo: "Vitrine" },
  { chave: "clientes", rotulo: "Clientes" },
  { chave: "agenda", rotulo: "Agenda" },
];

export default function App() {
  const [aba, setAba] = useState("vitrine");
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [aviso, setAviso] = useState(null);

  const recarregarClientes = useCallback(async () => {
    setClientes(await api.listarClientes());
  }, []);

  useEffect(() => {
    recarregarClientes().catch(() => setAviso({ tipo: "erro", texto: "Servidor indisponível." }));
    api.servicos().then(setServicos).catch(() => setServicos([]));
  }, [recarregarClientes]);

  return (
    <div className="pagina">
      <header className="topo">
        <p className="selo">Espaço de Beleza</p>
        <h1>Valquíria Goes</h1>
        <p className="subtitulo">Sistema de gestão e vitrine digital</p>
      </header>

      <nav className="abas" aria-label="Seções do sistema">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            type="button"
            className={aba === item.chave ? "aba ativa" : "aba"}
            onClick={() => setAba(item.chave)}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <main>
        {aba === "vitrine" && <Vitrine />}
        {aba === "clientes" && (
          <Clientes clientes={clientes} aoMudar={recarregarClientes} aoAvisar={setAviso} />
        )}
        {aba === "agenda" && (
          <Agenda clientes={clientes} servicos={servicos} aoAvisar={setAviso} />
        )}
      </main>

      <footer className="rodape">
        Projeto de Extensão III — Engenharia de Software
      </footer>
    </div>
  );
}
