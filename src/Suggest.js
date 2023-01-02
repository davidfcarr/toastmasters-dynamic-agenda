import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { SelectControl, RadioControl } from '@wordpress/components';
//import { AwesomeButton } from 'react-awesome-button';
//import 'react-awesome-button/dist/styles.css';

export default function Suggest(props) {
  const editorRef = useRef(null);
  const [member,setMember] = useState(0);
  const [ccme,setCcme] = useState('0');
  const [notification,setNotification] = useState(null);
  function makeNotification(message, error = false, rawhtml = false) {
    setNotification({'message':message,'error':error,'rawHTML':''});
    setTimeout(() => {
        setNotification(null);
        props.setSuggest(false);
    },5000);
}

function send() {
  if(!member) {
    setNotification({'message':'No recipient selected','error':true});
    return;
  }
    if (editorRef.current) {
        let message = editorRef.current.getContent();
        console.log(message + 'from '+props.current_user_id+' to '+member+' for post '+props.post_id+' '+props.roletag);
        let url = wpt_rest.url + 'rsvptm/v1/tm_role?tm_ajax=role';
        const formData = new FormData();
        formData.append('role', props.roletag);
        formData.append('user_id', member);
        formData.append('editor_id', props.current_user_id);
        formData.append('post_id', props.post_id);
        formData.append('timelord', rsvpmaker_rest.timelord);
        formData.append('suggest_note', message);
        formData.append('ccme', ccme);
        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
              'X-WP-Nonce': wpt_rest.nonce,
            },
            body: formData
          })
        .then((response) => {return response.json()})
        .then((responsedata) => {
            console.log(responsedata);
            makeNotification('Message sent');
                });
                //console.log(responsedata.status);
            }

        //https://demo.toastmost.org/wp-json/rsvptm/v1/tm_role?tm_ajax
}

  return (
    <>
    <SelectControl label="Member to Nominate" value={member} options={props.memberlist} onChange={(id) => { setMember(id); }} />
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={"I am nominating you for a role!"}
        init={{
          height: 100,
          menubar: false,
          toolbar: 'undo redo | bold italic | removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      <RadioControl selected={ccme} label="Send To" onChange={(value)=> setCcme(value)} options={[{'label': 'Member', 'value':'0'},{'label': 'Member + CC me', 'value':'1'},{'label': 'Me Only', 'value':'2'}]}/>
      <p><button className="tmform" type="primary" onClick={send}>Send Suggestion</button></p>
      {notification && <div className={notification.error ? "tm-notification tm-notification-error suggestion-notification": "tm-notification tm-notification-success suggestion-notification"}>{notification.message}</div>}
    </>
  );
}