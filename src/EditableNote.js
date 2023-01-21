import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import {SanitizedHTML} from './SanitizedHTML.js';

export function EditableNote(props) {
    const editorRef = useRef(null);
    console.log('EditableNote props');
    console.log(props);
    const {post_id, block, mode, makeNotification} = props;
    const {editable, uid, time_allowed} = block.attrs;

  function save() {
      const submitnote = {'note':editorRef.current.getContent(),'uid':props.uid,'post_id':props.post_id};
      editEditable.mutate(submitnote);
  }

  const { isLoading, isSuccess, isError, data, error, refetch } =
  useQuery('editable', fetchBlockData, { enabled: true, retry: 2, onSuccess, onError });
  function fetchBlockData() {
      return apiClient.get('editable_note_json?post_id='+post_id+'&uid='+uid);
  }
  
function onSuccess(e) {
    console.log(e);
}
function onError(e) {
    console.log(e);
}

  const editEditable = useMutation(
      (assignment) => { apiClient.post("editable_note_json", edit)},
      {      
        // Optimistically update the cache value on mutate, but store
        // the old value and return it so that it's accessible in case of
        // an error
        //,blockindex,roleindex
        onMutate: async (edit) => {
          await queryClient.cancelQueries('editable');
  
          const previousValue = queryClient.getQueryData("editable");
  
          // 성공한다고 가정하고 todos 데이터 즉시 업데이트.
          queryClient.setQueryData("blocks-data", (old) => { 
              old.data = edit;
              return ({...old})
      })
  
          return previousValue;
        },
        // On failure, roll back to the previous value
        onError: (err, variables, previousValue) => {
          console.log('mutate assignment error');
          console.log(err);
          queryClient.setQueryData("blocks-data", previousValue);
        },
        // After success or failure, refetch the todos query
        onSuccess: () => {
          queryClient.invalidateQueries("editable");
          makeNotification('Updated editable note');
        }
      }
  );

  if(isLoading)
      return <p>Loading ...</p>

  if('edit' == props.mode)
  return (
    <>
    <h3>{editable}</h3>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={data.data.note}
        init={{
          height: 100,
          menubar: false,
          toolbar: 'undo redo | bold italic | removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      <button className="tmform" onClick={save}>Update</button>
    </>
  );

  //view logic 
  return (
    <>
    <h3>{editable}</h3>
    <SanitizedHTML innerHTML={data.data.note} />
    </>
  );
}