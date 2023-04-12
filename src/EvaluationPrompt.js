import React, { useRef, useState } from 'react';
import { RadioControl } from '@wordpress/components';

export function EvaluationPrompt(props) {
const {item,promptindex,note,response,setResponses,setNotes} = props;
const [choice,setChoice] = useState(response);
const [edit,setEdit] = useState(true);

const notefield = useRef('');

function save (e) {
    e.preventDefault();
      setNotes((prev) => {prev[promptindex] = notefield.current.value; return prev});
      setEdit(false);
} 

  return (
    <div>
     <p><strong>{item.prompt}</strong> {choice}</p>
     {item.choices && (item.choices.length > 0) && <div>{(!choice || edit) && <RadioControl className="radio-mode" options={item.choices} selected={choice} onChange={(value) => { setChoice(value); setResponses((prev) => {let newd = [...prev]; newd[promptindex] = value; return newd }); }}  />}</div>}
     <p><textarea className="evaluation-note" ref={notefield} onBlur={save} /></p>
    </div>
  );
}