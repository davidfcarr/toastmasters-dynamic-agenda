import React, { useRef, useState, useEffect } from 'react';
import { RadioControl } from '@wordpress/components';

export function EvaluationPrompt(props) {
const {item,promptindex,note,response,setResponses,setNotes} = props;
const [choice,setChoice] = useState(response);
const [edit,setEdit] = useState(true);
const [savedtext,setSavedtext] = useState('');

function save (e) {
    e.preventDefault();
      setNotes((prev) => {prev[promptindex] = savedtext; return prev});
      setEdit(false);
} 

  return (
    <>
     <p><strong>{item.prompt}</strong> {choice}</p>
     {item.choices && (item.choices.length > 0) && <div>{(!choice || edit) && <RadioControl className="radio-mode" options={item.choices} selected={choice} onChange={(value) => { setChoice(value); setResponses((prev) => {let newd = [...prev]; newd[promptindex] = value; return newd }); }}  />}</div>}
     {(!note || edit) && <p><textarea className="evaluation-note" onBlur={save} value={savedtext} onChange={(e) => {setSavedtext(e.target.value)}} /></p>}
     {!edit && <p>{savedtext}</p>}
     {!edit && <p><button onClick={() => {setEdit(true)}}>Edit</button></p>}
    </>
  );
}