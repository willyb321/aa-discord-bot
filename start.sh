#!/bin/bash
service="aa-discord-bot"
restartdelay=3
processname="nodejs"
processargs="-expose-gc $service.js"
cd ~/$service
screen -wipe >/dev/null
case "$1" in
	start)
		echo "$service started." &
		while true; do
			$processname $processargs
			sleep $restartdelay
		done
		rm $service.pid
		echo "$service stopped." &
	;;
	restart)
		echo "$service restarting." &
		screen -r $service -p $service -X stuff $'stop\n' &
		sleep $restartdelay
		killall -15 $processname
		sleep $restartdelay
		killall -9 $processname
		sleep $restartdelay
		$0
	;;
	*)
		mypid=`cat ~/$service/$service.pid 2>/dev/null`
		if [ -n "$mypid" ]; then
			reallymypid=`ps ax | grep -v grep | grep $mypid`
			if [ -n "$reallymypid" ]; then
				echo "$service is already running, pid '$mypid'"
			else
				echo "$service stale pidfile found"
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
