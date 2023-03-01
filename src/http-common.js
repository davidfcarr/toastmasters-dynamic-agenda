import axios from "axios";

export default axios.create({
  baseURL: '/wp-json/rsvptm/v1/',
  headers: {
    "Content-type": "application/json",
    'X-WP-Nonce': wpt_rest.nonce,
  },
  validateStatus: function (status) {
    return status < 400; // Resolve only if the status code is less than 400
  }
});

//    'X-WP-Nonce': wpApiSettings.nonce
