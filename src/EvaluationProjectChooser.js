import React, {useState, useEffect, useRef} from "react"
import { SelectControl, TextControl } from '@wordpress/components';

export function EvaluationProjectChooser(props) {
    const [path, setPath] = useState('');
    const [choices, setChoices] = useState([]);
    const {project,manual,title,setEvaluate,setManual,setProject,setTitle,makeNotification} = props;

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/paths_and_projects', {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            if(data.paths) {
                setChoices(data);
            } 
        },[]);

        if(props.project)
        {
            startFromProject(props.project);
        }
    },[]);

    function startFromProject(project) {
        let manual = project.replace(/([\s0-9]+)$/,'');
        let path = manual.replace(/ Level.+/,'');
        setPath(path);
        if(!props.manual && manual)
            setManual(manual);
    }

    if(!choices || typeof choices.manuals == 'undefined')
        return <p>Loading project choices</p>
    return (
        <>
        <div><SelectControl options={choices['paths']} value={path} label="Path" onChange={(value) => setPath(value)} /></div>
        <div><SelectControl options={choices['manuals'][path]} value={manual} label="Level" onChange={(value) => {setManual(value)}} /></div>
        <div><SelectControl options={(choices['projects'][manual]) ? choices['projects'][manual] : [{'value':'',label:'Set Path and Level to See Projects'}] } value={project} label="Project" onChange={(value) => { setProject(value); setEvaluate((prev) =>{
            prev.manual = manual;
            prev.project = value;
            return prev;
        }); makeNotification('Loading evaluation form ...'); } } /></div>
        <p><strong>Title</strong> <TextControl value={title} onChange={(value) => {setTitle(value);setEvaluate((prev) =>{
            prev.title = value;
            return prev;
        });}} /></p>
        </>
    )
}
