import React from "react"
import ReactDOM from "react-dom"
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import Agenda from "./Agenda";
window.addEventListener('load', function(event) {
    const currentdoc = document.getElementById('react-agenda');
    let post_id = currentdoc.getAttribute('post_id');
    console.log('init post_id',currentdoc.getAttribute('post_id'));
    //const agenda_root = document.getElementById('react-agenda');
    //if(agenda_root)
        ReactDOM.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Agenda post_id={post_id} />
        </QueryClientProvider>
  </React.StrictMode>,
        document.getElementById('react-agenda'));
    //console.log('agenda div not found');
});

//<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
