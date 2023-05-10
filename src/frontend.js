import React from "react"
import ReactDOM from "react-dom"
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import Agenda from "./Agenda";
import {EvalWrapper} from "./EvalWrapper";
import ReorgWrapper from "./ReorgWrapper";

window.addEventListener('load', function(event) {
    try {
    const currentdoc = document.getElementById('react-agenda');
    let mode_init = currentdoc.getAttribute('mode');
    const evaluation = {'ID':'','name':'','project':'','manual':'','title':''};
    const evalme = currentdoc.getAttribute('evalme');
    if(evalme)
    {
        evaluation.ID = evalme;
        evaluation.name = currentdoc.getAttribute('name');
        evaluation.project = currentdoc.getAttribute('project');
        evaluation.manual = currentdoc.getAttribute('manual');
        evaluation.title = currentdoc.getAttribute('title');
        console.log('evaluation',evaluation);
    }
    if(('evaluation_demo' == mode_init) || ('evaluation_admin' == mode_init) || ('evaluation_guest' == mode_init))
    {
        ReactDOM.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <EvalWrapper mode_init={mode_init} evaluation={evaluation} />
                </QueryClientProvider>
          </React.StrictMode>,
                document.getElementById('react-agenda'));        
    }
    else if('settings_admin' == mode_init)
    {
        ReactDOM.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <ReorgWrapper />
                </QueryClientProvider>
          </React.StrictMode>,
                document.getElementById('react-agenda'));        
    }
    else {
        ReactDOM.render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <Agenda mode_init={mode_init} evaluation={evaluation} />
                </QueryClientProvider>
          </React.StrictMode>,
                document.getElementById('react-agenda'));        
    }
}
catch(error) {
    console.log('no current doc found',error);
}

});

//<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
