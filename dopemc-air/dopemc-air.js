/*
var channel = new air.SoundChannel();
var request = new air.URLRequest( 'http://mp3.streampower.be:80/stubru-high.mp3' );
var sound = new air.Sound();
sound.load( request );
channel = sound.play();
*/

air.NetConnection.prototype.onBWDone = function( p_bw ) {

	air.trace( "onBWDone: " + p_bw );
};

var BattleClient = function() {

	BattleClient.prototype.onMetaData = function( info ) {

		air.trace( "metadata: duration=" + info.duration + " width=" + info.width + " height=" + info.height + " framerate=" + info.framerate );
    }

    BattleClient.prototype.onCuePoint = function( info ) {
        air.trace( "cuepoint: time=" + info.time + " name=" + info.name + " type=" + info.type );
    }
}

DopeMC.air = {

			streamUrl : 'rtmp://192.168.1.140/myLiveApp/instance1', 
			streamName : 'dopemc-test',
        	connection : null,
        	stream : null,

			initViewer : function() {

				DopeMC.connection = new air.NetConnection(),
	        	DopeMC.connection.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.viewStatusHandler ),
	        	DopeMC.connection.addEventListener( air.SecurityErrorEvent.SECURITY_ERROR, DopeMC.securityErrorHandler ),
	        	DopeMC.connection.connect( DopeMC.streamUrl );
			},

			initBroadcast : function() {

				DopeMC.connection = new air.NetConnection(),
	        	DopeMC.connection.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.broadcastStatusHandler ),
	        	DopeMC.connection.addEventListener( air.SecurityErrorEvent.SECURITY_ERROR, DopeMC.securityErrorHandler ),
	        	DopeMC.connection.connect( DopeMC.streamUrl );
			},

			viewStatusHandler : function( event ) {

				switch (event.info.code) {

	                case "NetConnection.Connect.Success":
	                    DopeMC.playViewer();
	                    break;

	                case "NetStream.Play.StreamNotFound":
	                    air.trace("Stream not found: " + DopeMC.streamName );
	                    break;
						
					case "NetStream.Play.UnpublishNotify":
						 air.trace( 'UnpublishNotify');
						 break;
						 
					case "NetStream.Play.PublishNotify":
						 air.trace( "Stream published" );
						 break;

					default:
						air.trace( 'netStatusHandler unexpected code: ' + event.info.code  ); 
            	}
        	},

			broadcastStatusHandler : function( event ) {

				switch (event.info.code) {

	                case "NetConnection.Connect.Success":
	                    DopeMC.broadcast();
	                    break;

	                case "NetStream.Play.StreamNotFound":
	                    air.trace("Stream not found: " + DopeMC.streamName );
	                    break;
						
					case "NetStream.Play.UnpublishNotify":
						 air.trace( 'UnpublishNotify');
						 break;
						 
					case "NetStream.Play.PublishNotify":
						 air.trace( "Stream published" );
						 break;

					default:
						air.trace( 'netStatusHandler unexpected code: ' + event.info.code  ); 
            	}
        	},

			securityErrorHandler : function( event ) {
            
				air.trace("securityErrorHandler: " + event);
        	},

			playViewer : function() {

				stream = new air.NetStream( DopeMC.connection );
	            stream.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.viewStatusHandler );
	            stream.client = new BattleClient();

				var video = new air.Video();
	            video.attachNetStream( stream );
	            stream.play( DopeMC.streamName );
	            window.htmlLoader.stage.addChild( video );
        	},
			
			broadcast : function() {

				var mic = air.Microphone.getMicrophone( -1 );
					mic.setUseEchoSuppression( true );

				var cam = air.Camera.getCamera();
					cam.setQuality(144000, 85);
					cam.setMode(320, 240, 15);
					cam.setKeyFrameInterval(60);

				// Setup the video loopback.
				video = new air.Video();
				video.attachCamera( cam );

				stream = new air.NetStream( DopeMC.connection );
				stream.attachCamera( cam );
				stream.attachAudio( mic );
	            stream.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.broadcastStatusHandler );
	            stream.client = new BattleClient();
				stream.publish( DopeMC.streamName );

				window.htmlLoader.stage.addChild( video );
			}
}

//DopeMC.initBroadcast();