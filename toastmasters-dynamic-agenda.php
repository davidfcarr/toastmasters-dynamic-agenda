<?php
/**
 * Plugin Name:       Toastmasters Dynamic Agenda
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
	/*
	global $post, $current_user;
	echo dirname( __FILE__ );
	wp_register_script('toastmasters_dynamic_agenda_js',plugins_url( 'toastmasters-dynamic-agenda/dist/frontend.js'),array( 'react', 'react-dom', 'wp-components', 'wp-i18n', 'wp-element')); //,filemtime( plugin_dir_path( __DIR__ ) . 'dist/frontend.js' )
	wp_localize_script( 'toastmasters_dynamic_agenda_js', 'wpt_env',
	array( 
		'post_id' => ($post) ? $post->ID : 0,
		'post_type' => ($post) ? $post->post_type : '',
		'current_user' => ($current_user) ? $current_user->ID : 0,
		'date' => '',//
		'editor' => true, //
		'organizer' => true,//
	)
	
);
	*/
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