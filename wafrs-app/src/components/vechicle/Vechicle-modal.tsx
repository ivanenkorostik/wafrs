import { useEffect, useState } from "react";
import { deleteVehicle, saveVehicle, getVehicles, type Vehicle } from "../../api/mycar-api";
import { IoCloseSharp } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";
import { AUTH_TOKEN_KEY } from "../../constants/auth";

import './Vechicle-modal.css';

type ModalProps = {
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onVehicleDeleted: (id: number) => void;
};


function Modal({onClose, onSelectVehicle, onVehicleDeleted}:ModalProps) {

  const[model,setModel] = useState("");
  const [fuelAvg, setFuelAvg]= useState(0);
  const [fuelCity, setFuelCity]= useState(0);
  const [fuelType, setFuelType]= useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<number | null>(null);

  
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  async function handleSave() {
    
    if (!token) {
      setError("Користувач не авторизований");
      return;
    }
    const payload = {
      model,
      fuel_avg: fuelAvg,
      fuel_city: fuelCity,
      fuel_type: fuelType,
    };
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const createdVehicle = await saveVehicle(payload, token);
      setVehicles((currentVehicles) => [createdVehicle, ...currentVehicles]);
      setModel("");
      setFuelAvg(0);
      setFuelCity(0);
      setFuelType("");
      setSuccess(`Авто «${createdVehicle.model}» успішно додано`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при збереженні інформації про авто");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteVehicle(id: number) {
    if (!token) {
      setError("Користувач не авторизований");
      return;
    }

    setDeletingVehicleId(id);
    setError(null);
    setSuccess(null);

    try {
      await deleteVehicle(id, token);
      setVehicles((currentVehicles) =>
        currentVehicles.filter((vehicle) => vehicle.id !== id)
      );
      onVehicleDeleted(id);
      setSuccess("Авто успішно видалено");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити авто");
    } finally {
      setDeletingVehicleId(null);
    }
  }

  useEffect(() => {
  async function loadVehicles() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setError("Користувач не авторизований");
      return;
    }

    setIsLoadingVehicles(true);
    setError(null);

    try {
      const userVehicles = await getVehicles(token);
      setVehicles(userVehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити авто");
    } finally {
      setIsLoadingVehicles(false);
    }
  }

  loadVehicles();
}, []);
  


  return (
    <div className="modal-overlay">
      <section className="modal-content">
        <div className="modal-header">
          <h2>Мої авто</h2>
          <button onClick={onClose} className="modal-close-button" type="button">
            <IoCloseSharp />
          </button>
        </div>
        <div className="vehicle-list">
          {isLoadingVehicles && <p>Завантаження авто...</p>}
           {!isLoadingVehicles && vehicles.length === 0 && (
            <p>У вас ще немає збережених авто.</p>
          )}
          {!isLoadingVehicles && vehicles.map((vehicle) => (
            <article className="vehicle-item" key={vehicle.id}>
              <button
                type="button"
                className="vehicle-item-select"
                onClick={() => {onSelectVehicle(vehicle); onClose();}}
              >
                <strong>{vehicle.model}</strong>
                <span>Траса: {vehicle.fuel_avg} л/100 км</span>
                <span>Місто: {vehicle.fuel_city} л/100 км</span>
                <span>Пальне: {vehicle.fuel_type}</span>
              </button>
              <button
                type="button"
                className="vehicle-item-delete"
                aria-label={`Видалити авто ${vehicle.model}`}
                disabled={deletingVehicleId === vehicle.id}
                onClick={() => handleDeleteVehicle(vehicle.id)}
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        <form className="vehicle-form">
          <h3>Додати автомобіль</h3>
          <label className="modal_field">
            Модель авто:
            <input type ="text" value={model} onChange={(e)=> setModel(e.target.value)}/>
          </label>
          <label className="modal_field">
            Витрати по трасі:
            <input type ="number" value={fuelAvg} onChange={(e)=> setFuelAvg(Number(e.target.value))}/>
          </label>
          <label className="modal_field">
            Витрати по місто:
            <input type ="number" value={fuelCity} onChange={(e)=> setFuelCity(Number(e.target.value))}/>
          </label>
          <label className="modal_field">
            Тип пального:
          <select value ={fuelType} onChange={(e)=> setFuelType(e.target.value)}>
            <option value="">Оберіть пальне</option>
              <option value="92">А-92</option>
              <option value="95">А-95</option>
              <option value="diesel">Дизель</option>
              <option value="lpg">Газ</option>
            </select>
          </label>
          {success && <p className="modal-success">{success}</p>}
          {error && <p className="modal-error">{error}</p>}

          <button type="button" className="modal-save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Збереження..." : "Зберегти"}
          </button>
        </form>
        
      </section>
    </div>
  );
}
export default Modal;
