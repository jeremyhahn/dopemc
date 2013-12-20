package com.dopemc.server;

import org.red5.logging.Red5LoggerFactory;
import org.red5.server.api.IConnection;
import org.red5.server.stream.ClientBroadcastStream;
import org.slf4j.Logger;

/**
 * <code>StreamManager</code> provides services for recording
 * the broadcast stream.
 */
public class StreamManager {

	private static final Logger logger = Red5LoggerFactory.getLogger(StreamManager.class, "recorder");

	// Application components
	private Application app;

	/**
	 * Start recording the publishing stream for the specified
	 * <code>IConnection</code>.
	 * 
	 * @param conn
	 */
	public void recordShow(IConnection conn) {
		logger.debug("Recording show for: {}", conn.getScope().getContextPath());
		String streamName = String.valueOf(System.currentTimeMillis());
		// Get a reference to the current broadcast stream.
		ClientBroadcastStream stream = (ClientBroadcastStream) app.getBroadcastStream(conn.getScope(), "hostStream");
		try {
			// Save the stream to disk.
			stream.saveAs(streamName, false);
		} catch (Exception e) {
			logger.error("Error while saving stream: {}", streamName);
		}
	}

	/**
	 * Stops recording the publishing stream for the specified
	 * <code>IConnection</code>.
	 * 
	 * @param conn
	 */
	public void stopRecordingShow(IConnection conn) {
		logger.debug("Stop recording show for: {}", conn.getScope().getContextPath());
		// Get a reference to the current broadcast stream.
		ClientBroadcastStream stream = (ClientBroadcastStream) app.getBroadcastStream(conn.getScope(), "hostStream");
		// Stop recording.
		stream.stopRecording();
	}

	/* ----- Spring injected dependencies ----- */

	public void setApplication(Application app) {
		this.app = app;
	}
}
