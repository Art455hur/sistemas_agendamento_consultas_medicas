
CREATE DATABASE IF NOT EXISTS consultorio
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE consultorio;

CREATE TABLE IF NOT EXISTS usuarios (
    nome VARCHAR(150),
    email VARCHAR(254),
    senha VARCHAR(255),
    funcao ENUM('Paciente', 'Médico'),
    CONSTRAINT email_unico UNIQUE (email)
);