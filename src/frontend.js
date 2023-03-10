import React from "react"
import ReactDOM from "react-dom"
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import Agenda from "./Agenda";
import {EvalWrapper} from "./EvalWrapper";

window.addEventListener('load', function(event) {
    const currentdoc = document.getElementById('react-agenda');
    let mode_init = currentdoc.getAttribute('mode');
    if(('evaluation_demo' == mode_init) || ('evaluation_admin' == mode_init))
    {
        ReactDOM.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <EvalWrapper mode_init={mode_init} />
                </QueryClientProvider>
          </React.StrictMode>,
                document.getElementById('react-agenda'));        
    }
    else {
        ReactDOM.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <Agenda mode_init={mode_init} />
                </QueryClientProvider>
          </React.StrictMode>,
                document.getElementById('react-agenda'));        
    }
    
});

//<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
