<?php
/**
 * DISABLED Plugin Name:       Toastmasters Dynamic Agenda
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       toastmasters-dynamic-agenda
 *
 * @package           create-block
 */

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function create_block_toastmasters_dynamic_agenda_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_toastmasters_dynamic_agenda_block_init' );

add_filter('block_type_metadata_settings','agenda_block_type_metadata',10,2);

function agenda_block_type_metadata($metadata) {
	global $post, $current_user;
	if(!empty($metadata['view_script_handles']) && in_array('wp4toastmasters-toastmasters-dynamic-agenda-view-script',$metadata['view_script_handles'])) {
		wp_localize_script( 'wp4toastmasters-toastmasters-dynamic-agenda-view-script', 'wpt_rest',wpt_rest_array());
	}
	return $metadata;
}

function get_dynamic_agenda_script_handle ($type) {
return generate_block_asset_handle( 'wp4toastmasters/toastmasters-dynamic-agenda', $type);
}
if(isset($_GET['newsignup'])|| get_option('wp4t_newSignupDefault')) {
	add_action('wp_enqueue_scripts', 'dynamic_agenda_script');
	if(isset($_GET['page']) && 'wp4t_evaluations' == $_GET['page'])
		add_action('admin_enqueue_scripts', 'dynamic_agenda_script');
}
function dynamic_agenda_script() {
	wp_enqueue_script(get_dynamic_agenda_script_handle('viewScript'));
	wp_enqueue_style(get_dynamic_agenda_script_handle('style'));
	wp_localize_script( 'wp4toastmasters-toastmasters-dynamic-agenda-view-script', 'wpt_rest',wpt_rest_array());
}
