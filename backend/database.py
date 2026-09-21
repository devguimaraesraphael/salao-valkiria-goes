import sqlite3
from pathlib import Path

from flask import g

DB_PATH = Path(__file__).parent / "salao.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    observacoes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    preco REAL NOT NULL,
    duracao_min INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servico_id INTEGER NOT NULL REFERENCES servicos(id),
    data TEXT NOT NULL,
    horario TEXT NOT NULL
);
"""

SERVICOS_INICIAIS = [
    ("Corte de cabelo", 60.0, 45),
    ("Coloração", 180.0, 120),
    ("Mechas / luzes", 250.0, 180),
    ("Hidratação capilar", 90.0, 60),
    ("Escova", 50.0, 40),
    ("Manicure e pedicure", 70.0, 60),
    ("Massagem relaxante", 120.0, 60),
]

SALAO = {
    "nome": "Espaço de Beleza Valquíria Goes",
    "endereco": "Estrada do Galeão, 2715 - Sala 210",
    "whatsapp_numero": "5521000000000",
    "horario_funcionamento": "Terça a sábado, das 9h às 19h",
    "descricao": (
        "Cuidados capilares e estéticos com atendimento personalizado. "
        "Agende seu horário e venha cuidar de você."
    ),
}


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.executescript(SCHEMA)
        db.executemany(
            "INSERT OR IGNORE INTO servicos (nome, preco, duracao_min) VALUES (?, ?, ?)",
            SERVICOS_INICIAIS,
        )
