import Link from "next/link";

export default function Agendar() {
  return (
    <main>
      <h1>Agendar Consulta</h1>

      <form>
        <div>
          <label htmlFor="especialidade">
            Especialidade
          </label>
          <br />
          <select id="especialidade">
            <option value="">Selecione uma especialidade</option>
            <option value="clinico-geral">Clínico Geral</option>
            <option value="cardiologia">Cardiologia</option>
            <option value="dermatologia">Dermatologia</option>
            <option value="pediatria">Pediatria</option>
            <option value="ortopedia">Ortopedia</option>
          </select>
        </div>

        <br />

        <div>
          <label htmlFor="medico">
            Médico
          </label>
          <br />
          <select id="medico">
            <option value="">Selecione um médico</option>
            <option value="dr-joao">Dr. João Silva</option>
            <option value="dra-ana">Dra. Ana Souza</option>
            <option value="dr-carlos">Dr. Carlos Oliveira</option>
          </select>
        </div>

        <br />

        <div>
          <label htmlFor="data">
            Data da consulta
          </label>
          <br />
          <input type="date" id="data" />
        </div>

        <br />

        <div>
          <label htmlFor="horario">
            Horário
          </label>
          <br />
          <select id="horario">
            <option value="">Selecione um horário</option>
            <option value="08:00">08:00</option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
          </select>
        </div>

        <br />

        <Link href="/confirmacao">
          <button type="button">
            Agendar consulta
          </button>
        </Link>
      </form>
    </main>
  );
}