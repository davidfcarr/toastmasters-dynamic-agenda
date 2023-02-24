import React, {useState, useEffect} from "react"
import { SelectControl, TextareaControl, RadioControl } from '@wordpress/components';
import { SanitizedHTML } from './SanitizedHTML.js';
import { useEvaluation,initSendEvaluation } from './queries.js';
import { EvaluationProjectChooser } from "./EvaluationProjectChooser.js";
import { EvaluationPrompt } from "./EvaluationPrompt.js";

export function EvaluationTool(props) {
const {makeNotification,data,evaluate,setEvaluate,scrolltoId} = props;
const {isLoading,isFetching,data:evaldata} = useEvaluation(evaluate.project, onSuccess);

const [path, setPath] = useState('Path Not Set');
const [manual, setManual] = useState((evaluate && evaluate.manual) ? evaluate.manual : '');
const [title, setTitle] = useState((evaluate && evaluate.title) ? evaluate.title : '');
const [responses,setResponses] = useState([]);
const [notes,setNotes] = useState([]);
const [form,setForm] = useState({});
const [sent,setSent] = useState('');

const {mutate:sendEvaluation} = initSendEvaluation(data.post_id, setSent,makeNotification);

useEffect(()=>{
    scrolltoId('react-agenda');
},[sent,form]);

function onSuccess(e) {
    setForm({'prompts':e.data.form,'intro':e.data.intro});
}
/*
if(preview) {
    console.log('evaluation to preview',evaluation);
return (
        <div>
        <h1>Preview</h1>
        <h3>{evaluate.manual && <span>{evaluate.manual}</span>} {evaluate.project}</h3>
        {evaluate.title && <p><em>{evaluate.title}</em></p>}
        {form.prompts.map(
            (p) => { return (
            <div>
                <p>{p.prompt}</p>
                <p>{p.choices && p.choices.length > 0 && <>{p.choices.map( (ch) => { let x=(ch == p.choice) ? 'X' : ''; return <span> {ch} {x}</span>} )}</>  }</p>
            </div>)
        })}
        </div>        
);
}
*/

if(isLoading || isFetching)
    return <p>Loading ...</p>

const assignment_options = [{'value':'','label':'Choose Speaker'}];
data.blocksdata.forEach( (block) => {
    //console.log('eval block',block);
    if(block.attrs && block.attrs.role && 'Speaker' == block.attrs.role) {
        block.assignments.forEach( (assignment) => {
            if(('' != assignment.ID) && ('0' != assignment.ID) && (0 != assignment.ID)) {
                let label = (assignment.project_text) ? ' / '+assignment.project_text : ' / Speech Project Not Set';
                assignment_options.push({'value':JSON.stringify(assignment),'label':assignment.name+label});  
            }
        } )
        if(evaluate.ID > 0)
        assignment_options.push({'value':JSON.stringify(evaluate),'label':evaluate.name});
        block.memberoptions.forEach(
            (member) => {
                if(member.value > 0) {
                    assignment_options.push({'value':JSON.stringify({'ID':member.value,'name':member.label,'project':''}),'label':member.label});
                }
            }
        );
    }
});

console.log('assignment options',assignment_options);

function send() {
    const ev = {'evaluate':evaluate,'form':form,'responses':responses,'notes':notes};
    console.log('send evaluation',ev);
    sendEvaluation(ev);
}

let done;
let openslots = [];

return (
    <div className='eval'>
        <h2>Evaluation Tool</h2>
        {sent && <div><SanitizedHTML innerHTML={sent} /><p><button onClick={() => {setSent('');setEvaluate({'ID':'','name':'','project':'','manual':'','title':''});setTitle('');}}>Reset</button></p></div>}
        <SelectControl value={JSON.stringify(evaluate)} options={assignment_options} onChange={(value) => {setEvaluate(JSON.parse(value))} } />
        <EvaluationProjectChooser manual={manual} project={evaluate.project} title={title} setManual={setManual} setTitle={setTitle} setEvaluate={setEvaluate} makeNotification={makeNotification} />
        <SanitizedHTML innerHTML={form.intro} />
        {form.prompts.map((item,index) => {
            if(!(responses[index] || notes[index]))
                openslots.push(index);
            return <div><EvaluationPrompt promptindex={index} response={responses[index]} note={notes[index]} setResponses={setResponses} setNotes={setNotes} item={item} /></div>
        })}
        {openslots.length > 0 && <p><em>{openslots.length} prompts have not been answered</em></p>}
        <p><button className="tmform" onClick={send}>Send</button></p>
    </div>
)
}
