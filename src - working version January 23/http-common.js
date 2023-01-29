import axios from "axios";

export default axios.create({
  baseURL: '/wp-json/rsvptm/v1/',
  headers: {
    "Content-type": "application/json",
    'X-WP-Nonce': wpt_rest.nonce,
  }
});

//    'X-WP-Nonce': wpApiSettings.nonce