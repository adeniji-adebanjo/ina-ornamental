<?php
/**
 * WordPress constants for the "Next.js owns the apex" architecture.
 *
 * Paste these into /var/www/wordpress/wp-config.php ABOVE the line:
 *     /* That's all, stop editing! Happy publishing. *​/
 *
 * Defining WP_HOME / WP_SITEURL here overrides the values stored in the
 * database, so no SQL update is needed and the admin keeps working at the apex.
 */

/* Site lives on the apex over HTTPS. */
define( 'WP_HOME',    'https://inaornamentalfish.com' );
define( 'WP_SITEURL', 'https://inaornamentalfish.com' );

/* Force the dashboard/login over HTTPS. */
define( 'FORCE_SSL_ADMIN', true );

/*
 * WordPress sits behind the Nginx TLS terminator, so PHP sees plain HTTP.
 * Trust the proxy's X-Forwarded-Proto so WordPress builds https:// URLs and
 * avoids redirect loops. (Nginx sets this header for the PHP locations.)
 */
if ( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] )
     && 'https' === $_SERVER['HTTP_X_FORWARDED_PROTO'] ) {
    $_SERVER['HTTPS'] = 'on';
}
if ( isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
    // Use the real client IP (first hop) for comments, security plugins, etc.
    $_SERVER['REMOTE_ADDR'] = trim( explode( ',', $_SERVER['HTTP_X_FORWARDED_FOR'] )[0] );
}

/* The Next.js frontend handles public pages; let system cron drive WP cron. */
define( 'DISABLE_WP_CRON', true );

/* Optional hardening: block plugin/theme edits & (if desired) updates via admin. */
define( 'DISALLOW_FILE_EDIT', true );
