import './routepanel.css'
import RouteInfo from '../routeinfo/routeInfo' 



function RoutePanel() {
    return (
        <section className="routePanel">
            <div className="fields">
                <div className="field-start">
                    <label htmlFor="start">Start Location</label>
                    <input type="text" placeholder="Start Location" />
                </div>
                <div className="field-end">
                    <label htmlFor="end">End Location</label>
                    <input type="text" placeholder="End Location" />
                </div>
                <div className="field-fuel">
                    <label htmlFor="fuel">Fuel Consumption</label>
                    <input type="text" placeholder="fuel consumption" />
                </div>
                <button className='btn-calc'>Створити марщрут</button>
                <RouteInfo />
            </div>
        </section>
    )
}
export default RoutePanel;