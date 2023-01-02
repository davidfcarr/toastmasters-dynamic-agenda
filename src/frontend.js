import React from "react"
import ReactDOM from "react-dom"

import Agenda from "./Agenda";
window.addEventListener('load', function(event) {
    const agenda_root = document.getElementById('react-agenda');
    if(agenda_root)
        ReactDOM.render(<Agenda />,agenda_root);
    console.log('agenda div not found');
});