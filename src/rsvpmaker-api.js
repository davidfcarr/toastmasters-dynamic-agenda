import React from "react"
import {useQuery,useMutation, useQueryClient} from 'react-query';
import axios from "axios";

const rsvpmakerClient = axios.create({
  baseURL: '/wp-json/rsvpmaker/v1/',
  headers: {
    "Content-type": "application/json",
    'X-WP-Nonce': wpt_rest.nonce,
  }
});

export function rsvpMetaData(post_id) {
    function fetchMeta(queryobj) {
        return rsvpmakerClient.get('json_meta?post_id='+post_id);
    }
    return useQuery(['rsvp-meta',post_id], fetchMeta, { enabled: true, retry: 2, onSuccess, onError, refetchInterval: 50000 });
}
function onSuccess(e) {
    console.log('downloaded rsvp data',e);
}
function onError(e) {
console.log('error downloading rsvp data',e);
}

async function updateRSVPMeta (changes) {
    return await rsvpmakerClient.post('json_meta?post_id='+changes.post_id, changes);
}

export function initRSVPMetaMutate(post_id,makeNotification) {
    const queryClient = useQueryClient();
    return useMutation(updateRSVPMeta, {
        onMutate: async (changes) => {
            await queryClient.cancelQueries(['rsvp-meta',post_id]);
            const previousValue = queryClient.getQueryData(['rsvp-meta',post_id]);
            queryClient.setQueryData(['rsvp-meta',post_id],(oldQueryData) => {
                //function passed to setQueryData
                const {data:changed} = oldQueryData;
                changes.kv.forEach( (item) => {
                    changed[item.key] = item.value;
                } );
                const newdata = {
                    ...oldQueryData, data: changed
                };
                console.log('modified query to return',newdata);
                return newdata;
            }) 
            makeNotification('Updating ...');
            return {previousValue}
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries(['rsvp-meta',post_id]);
            makeNotification('Updated');
        },
        onError: (err, variables, context) => {
            console.log('mutate rsvpmaker meta error');
            console.log(err);
            queryClient.setQueryData(['rsvp-meta',post_id], context.previousValue);
          },
    
          }
)
}
