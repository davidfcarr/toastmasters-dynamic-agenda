import React from "react"
import ReactDOM from "react-dom"

import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import Agenda2 from "./Agenda2";
window.addEventListener('load', function(event) {
    //const agenda_root = document.getElementById('react-agenda');
    //if(agenda_root)
        ReactDOM.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Agenda2 />
        </QueryClientProvider>
  </React.StrictMode>,
        document.getElementById('react-agenda'));
    //console.log('agenda div not found');
});