#!/bin/bash
export NODE_ENV=production
service="aa-discord-bot"
restartdelay=1
processname="nodejs"
processargs="$service.js"
cd ~/$service
screen -wipe >/dev/null
case "$1" in
	start)
		broadcastmessage "$service started." &
		while true; do
			$processname $processargs
			sleep $restartdelay
		done
		rm $service.pid
		broadcastmessage "$service stopped." &
	;;
	databaseparser)
		python2 databaseparser.py > database.json
	;;
	*)
		mypid=`cat ~/$service/$service.pid 2>/dev/null`
		if [ -n "$mypid" ]; then
			reallymypid=`ps ax | grep -v grep | grep $mypid`
			if [ -n "$reallymypid" ]; then
				echo "$service is already running, pid '$mypid'"
			else
				broadcastmessage "$service stale pidfile found"
				rm ~/$service/$service.pid
				$0
			fi
		else
			echo "Starting $service..."
			screen -t $service -dmS $service $0 start &
			echo $! > $service.pid
		fi
	;;
esac
