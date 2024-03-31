export const SystemTopics = {
  PUBLISH: '$PIGEON/new/publish',
  CLIENT_READY: '$PIGEON/event/ready/clients',
  CLIENT: '$PIGEON/event/clients',
  CLIENT_DISCONNECT: '$PIGEON/event/disconnect/clients',
  CLIENT_ERROR: '$PIGEON/event/error/clients',
  KEEP_LIVE_TIMEOUT: '$PIGEON/event/keepalivetimeout',
  ACK: '$PIGEON/event/ack',
  PING: '$PIGEON/event/ping',
  CONNACK_SENT: '$PIGEON/event/connack/sent',
  CLOSED: '$PIGEON/event/closed',
  CONNECTION_ERROR: '$PIGEON/event/error/connection',
  SUBSCRIBES: '$PIGEON/event/subscribes',
  UNSUBSCRIBES: '$PIGEON/event/unsubscribes',
  AUTHENTICATE: '$PIGEON/handle/authenticate',
  PRE_CONNECT: '$PIGEON/handle/preconnect',
  AUTHORIZE_PUBLISH: '$PIGEON/handle/authorizePublish',
  AUTHORIZE_SUBSCRIBE: '$PIGEON/handle/authorizeSubscribe',
  AUTHORIZE_FORWARD: '$PIGEON/handle/authorizeForward',
  PUBLISHED: '$PIGEON/handle/published',
  HEART_BEAT: /^\$?SYS\/([^/\n]*)\/heartbeat/,
};