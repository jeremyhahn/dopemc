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

var DopeTalk = {

			streamUrl : 'rtmp://beta.dopemc.com/DopeTalk',
			connection : null,

			user1 : null,
			user2 : null,

			init: function() {

				DopeTalk.updateStatus( 'Application initalized...' );
				DopeTalk.showConnect();
			},

			join : function() {

				DopeTalk.user1 = document.getElementById( 'user1' ).value;
				DopeTalk.user2 = document.getElementById( 'user2' ).value;

				if( !DopeTalk.user1.length ) {

					DopeTalk.updateStatus( 'You must enter a username!' );
					return false;
				}
				
				if( !DopeTalk.user2.length ) {

					DopeTalk.updateStatus( 'You must choose someone to talk to!' );
					return false;
				}

				DopeTalk.updateStatus( 'Attempting conversation between ' + DopeTalk.user1 + ' and ' + DopeTalk.user2 + '.' );

				document.getElementById( 'appStage' ).innerHTML = '';

				DopeTalk.connect();
			},

			connect : function() {

				DopeTalk.connection = new air.NetConnection(),
	        	DopeTalk.connection.addEventListener( air.NetStatusEvent.NET_STATUS, DopeTalk.statusHandler ),
	        	DopeTalk.connection.addEventListener( air.SecurityErrorEvent.SECURITY_ERROR, DopeTalk.securityErrorHandler ),
	        	DopeTalk.connection.connect( DopeTalk.streamUrl );
			},

			converse : function() {

				var microphone = air.Microphone.getMicrophone( -1 );
					microphone.gain = 80;
					microphone.rate = 12;
					microphone.setSilenceLevel( 15,2000 );
					microphone.setUseEchoSuppression( true );

				var publisher = new air.NetStream( DopeTalk.connection );
					publisher.attachAudio( microphone );
					publisher.publish( DopeTalk.user1, "live" );

				var subscriber = new air.NetStream( DopeTalk.connection );
					subscriber.play( DopeTalk.user2 );
			},

			statusHandler : function( event ) {

				DopeTalk.updateStatus( event.info.code );

				switch( event.info.code ) {

	                case "NetConnection.Connect.Success":
	                    DopeTalk.converse();
	                    break;

	                case "NetStream.Play.StreamNotFound":
	                    DopeTalk.updateStatus( "Stream not found: " + DopeTalk.streamName );
	                    break;
						
					case "NetStream.Play.UnpublishNotify":
						 DopeTalk.updateStatus( 'UnpublishNotify');
						 break;
						 
					case "NetStream.Play.PublishNotify":
						 DopeTalk.updateStatus( "Stream published" );
						 break;

					default:
						DopeTalk.updateStatus( 'netStatusHandler unexpected code: ' + event.info.code  ); 
            	}
        	},

			securityErrorHandler : function( event ) {

				DopeTalk.updateStatus( "securityErrorHandler: " + event);
        	},

			updateStatus : function( message ) {

				var div = document.getElementById( 'status' );
					div.innerHTML += "<br>" + message;
					div.scrollTop = div.scrollHeight; 
			},

			showConnect : function() {

				var html = '<div style="padding-top: 25px;"><table border="0">';
					html += '<tr><th colspan="2">Set up your conversation</th></tr>';
					html += '<tr><td>Name:</td><td><input type="text" id="user1"></td></tr>';
					html += '<tr><td>Talk to:</td><td><input type="text" id="user2"></td></tr>';
					html += '<tr><td> </td><td><input type="button" value="Connect" onclick="DopeTalk.join();"></td></tr></table></div>';

				document.getElementById( 'appStage' ).innerHTML = html;
			}
}

window.onload = function(){

	DopeTalk.init();
}