import { FaHistory } from "react-icons/fa";
import "./Navbar.css";

type NavbarProps = {
    onOpenSavedRoutes: () => void;
};

function Navbar({ onOpenSavedRoutes }: NavbarProps){
    return(
        <section className="navbar">
            <button
                className="navbar-iconButton"
                type="button"
                onClick={onOpenSavedRoutes}
                aria-label="Відкрити збережені маршрути"
            >
                <FaHistory className="navbar-icon"/>
            </button>
        </section>
    )
}
export default Navbar;
