const GitHub = {
  client_id: "your client id",
  client_secret: "your client secret",
  scope: "read:user",
  redirect_url: "your redirect url",
  authorize_url: "https://github.com/login/oauth/authorize",
  access_token_url: "https://github.com/login/oauth/access_token",
}

// Client-side Web Applications
// Impolicit Flow
const GoogleClientWebApp = {
  client_id: "your client id",
  client_secret: "your client secret",
  redirect_uri: "your redirect uri",
  authorize_url: "https://accounts.google.com/o/oauth2/v2/auth",
  response_type: "token",
  scope: "https://www.googleapis.com/auth/userinfo.profile",
}

// Web Server Applications
const GoogleWebServerApp = {
  client_id: "your client id",
  client_secret: "your client secret",
  redirect_uri: "your redirect url",
  authorize_url: "https://accounts.google.com/o/oauth2/v2/auth",
  access_token_url: "https://www.googleapis.com/oauth2/v4/token",
  access_type: "online",
  response_type: "code",
  scope: "https://www.googleapis.com/auth/userinfo.profile",
}

const FacebookImplicit = {
  client_id: "your client id",
  client_secret: "your client secret",
  authorize_url: "https://www.facebook.com/v2.11/dialog/oauth",
  response_type: "token",
  redirect_uri: "https://www.facebook.com/connect/login_success.html",
}

const FacebookAuthCode = {
  client_id: "your client id",
  client_secret: "your client secret",
  authorize_url: "https://www.facebook.com/v2.11/dialog/oauth",
  access_token_url: "https://graph.facebook.com/v2.11/oauth/access_token",
  redirect_uri: "https://www.facebook.com/connect/login_success.html",
}

const Twitter = {
  oauth_consumer_key: "your consumer key",
  oauth_consumer_secret: "your consumer secret",
  request_token_url: "https://api.twitter.com/oauth/request_token",
  authenticate_url: "https://api.twitter.com/oauth/authenticate",
  access_token_url: "https://api.twitter.com/oauth/access_token",
  callback_url: "your callback url"
}

const mapTypeToConfig = type => {
  return {
    GitHub,
    GoogleWebServerApp,
    GoogleClientWebApp,
    FacebookImplicit,
    FacebookAuthCode,
    Twitter
  }[type]
}

module.exports = mapTypeToConfig
