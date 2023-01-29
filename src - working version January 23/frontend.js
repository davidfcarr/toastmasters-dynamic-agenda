import React from "react"
import ReactDOM from "react-dom"
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import Agenda from "./Agenda";
window.addEventListener('load', function(event) {
    //const agenda_root = document.getElementById('react-agenda');
    //if(agenda_root)
        ReactDOM.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Agenda />
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </QueryClientProvider>
  </React.StrictMode>,
        document.getElementById('react-agenda'));
    //console.log('agenda div not found');
});