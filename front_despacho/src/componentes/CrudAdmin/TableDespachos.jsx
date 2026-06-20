import { useState, useEffect } from "react";
import axios from "axios";
import { Modal } from "./Modal";
import { FormCierreDespacho } from "./FormCierreDespacho";

export const TableDespachos = () => {
  const [despachos, setDespachos] = useState([]);

  const formatValue = (value, fallback = "Sin dato") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    return value;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Sin valor";
    }

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatDate = (value) => {
    if (!value) {
      return "Pendiente";
    }

    const normalizedDate = String(value).split("T")[0];
    const [year, month, day] = normalizedDate.split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  };

  const formatDespachoStatus = (value) =>
    value ? "Despacho entregado" : "Despacho pendiente";

  const despacho = async () => {
    await axios
      .get("/api/v1/despachos", {
        headers:{
              'Content-Type': 'application/json',
              'Accept': 'application/json'
        }
      })
      .then((response) => {
        console.log(response.data);
        setDespachos(response.data);
      });
  };
  // Llamada a la función para obtener los datos cuando el componente se monta
  useEffect(() => {
    despacho();
  }, []);

  const [openModal, setOpenModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState(null);

  const handleAbrirModal = (despacho) => {
    setDespachoSeleccionado(despacho);
    setOpenModal(true);
  };

  return (
    <>
      <section className="grid text-center grid-cols-12 mb-8">
        <div className="col-span-12 flex justify-center">
          <div className="col-span-10 p-2 bg-white border border-gray-200 rounded-lg shadow dark:bg-white h-full overflow-hidden">
            <table className="table-fixed">
              <thead>
                <tr className="py-10">
                  <th className="pr-10">Orden de despacho</th>
                  <th className="pr-10">Orden de compra</th>
                  <th className="pr-10">Dirección de entrega</th>
                  <th className="pr-10">Fecha despacho</th>
                  <th className="pr-10">Patente Camión</th>
                  <th className="pr-10">Entregado</th>
                  <th className="pr-10">Intentos de entrega</th>
                  <th className="pr-10">Valor compra</th>
                </tr>
              </thead>
              <tbody>
                {despachos
                  .map((despacho) => (
                  <tr key={despacho.idDespacho}>
                    <td className="pr-10 py-10 items-center">
                      {formatValue(despacho.idDespacho, "N/A")}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatValue(despacho.idCompra)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatValue(despacho.direccionCompra)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatDate(despacho.fechaDespacho)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatValue(despacho.patenteCamion)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatDespachoStatus(despacho.despachado)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatValue(despacho.intento, 0)}
                    </td>
                    <td className="pr-10 py-10  items-center">
                      {formatCurrency(despacho.valorCompra)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleAbrirModal(despacho)}
                        className="py-1 bg-orange-200 px-8 rounded-xl shadow-md hover:bg-orange-300/70 transition-all duration-300 "
                      >
                        Cerrar despacho
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Modal
        onClose={() => {
          setOpenModal(false);
        }}
        open={openModal}
      >
        {despachoSeleccionado && (
          <FormCierreDespacho
            despacho={despachoSeleccionado}
            onClose={() => {
              //onclose es un prop que pasa funciones al modal con el form abierto, por ende al cerrarse, se ejecutan esas 2 funciones
              setOpenModal(false), despacho();
            }}
          />
        )}
      </Modal>
    </>
  );
};
