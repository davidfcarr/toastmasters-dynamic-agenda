import React, {useState, useEffect} from "react"
import { SelectControl, TextControl } from '@wordpress/components';

export default function ProjectChooser(props) {
    const [choices, setChoices] = useState([]);
    const [path, setPath] = useState('Path Not Set');

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/paths_and_projects', {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            if(data.paths) {
                setChoices(data);
            } 
        });

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
            props.onChangeFunction(manual,'manual',props.index);
    }

    function projectTime(project) {
        let value = (typeof choices['maxtime'][project] == 'undefined') ? '7' : choices['maxtime'][project];
        props.onChangeFunction(value,'maxtime',props.index);
        value = (typeof choices['display_time'][project] == 'undefined') ? '5 - 7 minutes' : choices['display_time'][project];
        props.onChangeFunction(value,'display_time',props.index);
    }

    if(!choices || typeof choices.manuals == 'undefined')
        return <p>Loading project choices</p>
    return (
        <>
        <div><SelectControl options={choices['paths']} value={path} label="Path" onChange={(value) => setPath(value)} /></div>
        <div><SelectControl options={choices['manuals'][path]} value={props.manual} label="Level" onChange={(value) => {props.onChangeFunction(value,'manual',props.index)}} /></div>
        <div><SelectControl options={choices['projects'][props.manual]} value={props.project} label="Project" onChange={(value) => { props.onChangeFunction(value,'project',props.index); projectTime(value); } } /></div>
        <div className="tmflexrow">
        <div className="tmflex50">
        <TextControl label="Display Time" onChange={(value) => { props.onChangeFunction(value,'display_time',props.index) } } value={props.display_time} />
        </div>
        <div className="tmflex50">
        <TextControl label="Maximum Time Allowed" onChange={(value) => { props.onChangeFunction(value,'maxtime',props.index) }} value={props.maxtime} />
        </div>
        </div>
        </>
    )
}
