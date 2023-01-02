import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function EditorMCE(props) {
  const editorRef = useRef(null);
  //const [showEditor,setShowEditor] = useState(false);

  function saveIntro() {
      props.updateSpeech(editorRef.current.getContent(),props.param,props.index);
      props.updateAssignments();
      setShowEditor(false);
  }
/*
  if(!showEditor) 
  return (
    <>
    <div dangerouslySetInnerHTML={{ __html: props.value }} />
    <button onClick={() => {setShowEditor(true)}}>Edit Intro</button>
    </>
  )
*/
  return (
    <>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={props.value}
        init={{
          height: 100,
          menubar: false,
          toolbar: 'undo redo | bold italic | removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      <button className="tmform" onClick={saveIntro}>Update</button>
    </>
  );

}