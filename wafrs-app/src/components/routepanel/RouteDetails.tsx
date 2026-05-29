import { useEffect } from 'react';
import type { RouteSummary } from "../../types";
import RouteInfo from "../routeinfo/RouteInfo";
import "./RouteDetails.css";


type RouteDetailsProps ={
    isOpen: boolean;
    route: RouteSummary | null;
    fuel: number;
    fueltype: string;
    onClose: () => void;
}


export function RouteDetails({ isOpen, route, fuel, fueltype, onClose }: RouteDetailsProps) {
    useEffect(() => {
        if (!isOpen) {return;}
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen) {
    return null;
  }
    return (
        <div className ="routeDetailsModal_overlay" onMouseDown={onClose}>
            <section 
            className="routeDetailsModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-details-title"
            onMouseDown={(event) => event.stopPropagation()}>
            <div className="routeDetailsModal_header">
                <h2 id="route-details-title">Деталі маршруту</h2>

                <button
                    className="routeDetailsModal_close"
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити"
                >
                    x
                </button>

            </div>
             <RouteInfo
                routeSummary={route}
                fuel={fuel}
                fueltype={fueltype}
                routeError={null}
                isRouteLoading={false}
            />
            </section>

        </div>
    );
}
export default RouteDetails;
