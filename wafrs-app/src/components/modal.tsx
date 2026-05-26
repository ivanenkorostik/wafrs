import { useState } from 'react';
import { saveVehicle } from "../api/mycar-api";
import './modal.css';

type ModalProps = {
  onClose: () => void;
};


function Modal({onClose}:ModalProps) {

  const[model,setModel] = useState("");
  const [fuelAvg, setFuelAvg]= useState(0);
  const [fuelCity, setFuelCity]= useState(0);
  const [fuelType, setFuelType]= useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const token = localStorage.getItem("wafrs_auth_token");
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
    try {
      await saveVehicle(payload, token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при збереженні інформації про авто");
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Вартість маршруту</h2>
        <form className="vehicle-form">
          <label>
            Модель авто:
            <input type ="text" value={model} onChange={(e)=> setModel(e.target.value)}/>
          </label>
          <label>
            Витрати по трасі:
            <input type ="number" value={fuelAvg} onChange={(e)=> setFuelAvg(Number(e.target.value))}/>
          </label>
          <label>
            Витрати по місто:
            <input type ="number" value={fuelCity} onChange={(e)=> setFuelCity(Number(e.target.value))}/>
          </label>
          <label>
            Тип пльного:
            
            <select value ={fuelType} onChange={(e)=> setFuelType(e.target.value)}>
              <option value="">Оберіть пальне</option>
                <option value="92">А-92</option>
                <option value="95">А-95</option>
                <option value="diesel">Дизель</option>
                <option value="lpg">Газ</option>
            </select>
          </label>

        </form>
        <p>Тут буде відображатися вартість маршруту після розрахунку.</p>
        {error && <p className="modal-error">{error}</p>}

        <button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Збереження..." : "Зберегти"}
        </button>
        <button onClick={onClose} className="modal-close-button" type="button">
          Закрити
        </button>
      </div>
    </div>
  );
}
export default Modal;