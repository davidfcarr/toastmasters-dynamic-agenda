import React, { useRef, useState, useEffect } from 'react';
import { RadioControl } from '@wordpress/components';

export function EvaluationPrompt(props) {
const {item,promptindex,note,response,setResponses,setNotes} = props;
//const editorRef = useRef(note);
const [choice,setChoice] = useState(response);
const [edit,setEdit] = useState(true);
const [savedtext,setSavedtext] = useState('');
//const [updated, setUpdated] = useState(0);

console.log('evaluation prompt props', props);
console.log('evaluation prompt note from props', note);

function shareResults() {
      console.log('prompt note',editorRef.current.getContent());
      console.log('prompt choice',choice);
  }

function save (e) {
    e.preventDefault();
    console.log('clicked notes save in edit prompt');
    /*
    if (editorRef.current) {
        const content = editorRef.current.value;
        setSavedtext(content);
        console.log('clicked notes saved',content);
        setNotes((prev) => {console.log('current notes',prev);prev[promptindex] = content; console.log('modified notes',prev); return prev});
      }
      */
      setNotes((prev) => {console.log('current notes',prev);prev[promptindex] = savedtext; console.log('modified notes',prev); return prev});
      setEdit(false);
} 
/*
  if(!edit) {
    return (<div>
    <p><strong>{item.prompt}</strong>: {response}</p>
    <p>{savedtext}</p>
    <p><button onClick={() => {setEdit(true)} }>Edit {item.choices && (item.choices.length > 0) && <>/ Add Note</>}</button></p> 
    </div>);
  }
*/
  return (
    <>
     <p><strong>{item.prompt}</strong> {choice}</p>
     {item.choices && (item.choices.length > 0) && <div>{(!choice || edit) && <RadioControl className="radio-mode" options={item.choices} selected={choice} onChange={(value) => { setChoice(value); setResponses((prev) => {let newd = [...prev]; newd[promptindex] = value; console.log('modified responses',newd); return newd }); }}  />}</div>}
     {(!note || edit) && <p><textarea className="evaluation-note" onBlur={save} value={savedtext} onChange={(e) => {setSavedtext(e.target.value)}} /></p>}
     {!edit && <p>{savedtext}</p>}
     {!edit && <p><button onClick={() => {setEdit(true)}}>Edit</button></p>}
    </>
  );
}