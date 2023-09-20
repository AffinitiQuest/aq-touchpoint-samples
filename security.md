# Touchpoint Security Considerations 

Integration of touchpoints into your application merits some thought about security considerations.
This document lays out approaches to integrating touchpoints securely. 

## Introduction
The primary way to use touchpoints in the AffinitiQuest platform is through the use of our HTML Custom Elements, also known as web components. These custom elements can be dropped into a 3rd-party web page to integrate AffinitiQuest functionality.

There are three kinds of touchpoints:
1. Primitive Touchpoint
2. Service Desk Touchpoint
3. Remote Device Touchpoint

### Primitive Touchpoint - ```<aq-touchpoint/>```
The primitive touchpoint type  allows for the 3 primitive operations supported by the AffinitiQuest Credential Orchestration platform.
1. Issue Credential
2. Verify Credential
3. Revoke Credential

### Remote Device Touchpoint - ```<aq-remotedevice/>```
The remote device touchpoint allows a web page containing the ```<aq-remotedevice/>``` element to be remote controlled by a web page that embeds an associated ```<aq-servicedesk/>``` component.

The remote control operations that may be received currently include the ability to dynamically instantiate a primitive touchpoint.

### Service Desk Touchpoint - ```<aq-servicedesk/>```
The service desk touchpoint allows a web page to assert remote control over another page that embeds the ```<aq-remotedevice/>``` touchpoint.

The remote control operations that may be sent currently include the ability to dynamically instantiate a primitive touchpoint.

In essence, an ```<aq-servicedesk/>``` can tell an ```<aq-remotedevice/>``` to run a particular primitive ```<aq-touchpoint/>```.

## Touchpoint Authentication

The touchpoint custom elements all need network access to the AffintiQuest server infrastructure. This access requires authentication. Authentication requires issuance and use of a JSON Web Token (JWT).

There are two different methods provided to support touchpoint authentication.

### Touchpoint Authentication - auth_url attribute

Each of the touchpoint HTML Custom elements takes an attribute named ```auth_url``` that is meant to specify a URL endpoint on the 3rd-party application that can be invoked by the component to generate and return a JWT access token.

An example might be:
```html
<aq-touchpoint tp_id="some-touchpoint-id" auth_url="/api/auth"/>
```

Assume that the page with this markup is loaded from:
   ```https://my.3rd-party-app.com``` and thus provides a URL endpoint at:
   ```https://my.3rd-party-app.com/api/auth```

The endpoint should generate an AffinitiQuest access token and return this JWT as the body of the response to the endpoint request.

The endpoint should be secured by your application. You do not want anybody to gain an access token that will allow arbitrary issuance, verification or revocation of credentials.

This method is appropriate if your application uses session cookies to manage authenticated access because the request to the ```auth_url``` will automatically include your session cookies.

Token expiry is handled automatically with this method as failures to authenticate will be retried using this auth_url.

### Touchpoint Authentication - auth_jwt attribute

Each of the touchpoint HTML Custom elements takes an attribute named ```auth_jwt``` that is meant to provide an already generated access token.

Generally your application server will generate this AffinitiQuest access token and make it available such as in the following example:
```html
<aq-touchpoint tp_id="some-touchpoint-id" auth_jwt="content-of-generated-access-token-JWT-goes-here"/>
```

Generation of this access token should be done by your server, not your client and this process should be secured. You should avoid putting API keys and other forms of credentials in your client code.

This method is approriate if your application uses an authentication method other than session cookies.

Token expiry is handled by your application through use of a javascript event handler.
Example code:
```javascript
const touchpointElement = document.querySelector('aq-touchpoint');
if( touchpointElement ) {
    touchpointElement.addEventListener('unauthorized', function(event) {
        // use whatevent means to get a new JWT access token. In this case assume session cookies are being used.
        const response = await fetch('/api/auth');
        if(response.ok) {
            const accessToken = await response.text();
            // update the 'auth_jwt' attribute of the element to use the new access token
            event.currentTarget.setAttribute('auth_jwt', accessToken );
        }
    });
}
```

## Touchpoint - ```app_context``` attribute

### ```app_context``` General
All of the touchpoint custom elements accept an optional attribute named ```app_context```. The value of this attribute is up to the application and is supplied back to the application in various javascript events and webhook callbacks. The
application can use this attribute to establish what the event/callback is in reference to.

### ```app_context``` Issuance Example
For example, let us assume your application is using an ```<aq-touchpoint/>``` to issue a credential to a customer whose identifier in your database is: ```'user-id-555-1212'```. In this case you might generate the touchpoint as follows:
```html
<aq-touchpoint tp_id="some-touchpoint-id" auth_url="/auth" app_context="user-id-555-1212"/>
```

When the primitive touchpoint doing the credential issuance reaches the point in the process where it requires the values of attributes to encode in the credential, it will exectue HTTP GET to a URL in your application which is configured for the touchpoint in the AffinitiQuest administration portal. Lets assume that the endpoint configured is: 
```html
https://my.3rd-party-app.com/api/webhook/issuance/attributes
```

When this webhook is invoked, the URL query parameter ```app_context=user-id-555-1212``` will be be appended to the URL like:
```html
https://my.3rd-party-app.com/api/webhook/issuance/attributes?appContext=user-id-555-1212
```

So, when your application endpoint is invoked, it can extract the app_context query parameter from the URL and use the associated value to look up information about the specific user in the application database.

### ```app_context``` and Success
When primitive touchpoints execute, there are two ways for your application to be notified of success:
* a javascript 'succeeded' event 
  * ```querySelector('aq-touchpoint').addEventListener('succeeded', handlerFunction)```
  * The handler function accepts an event parameter. 
  * event.detail.appContext will be provided. 
* a webhook POST to a URL configured for the touchpoint. 
  * Configuration is done in the AffinitiQuest administration portal.
  * a URL query parameter named appContext will be provided.

In both cases, the app_context will be provided.

### ```app_context``` with ```<aq-servicedesk/>``` & ```<aq-remotedevice/>```

When an ```app_context``` is provided as an attribute to the ```<aq-remotedevice/>``` custom element, it will
be provided to a dynamically run ```<aq-touchpoint/>``` unless ```app_context``` is provided by the invoking ```<aq-servicedesk/>```.

What this means is that an ```app_context``` provided by ```<aq-servicedesk/>``` will take precedence over an 
```app_context``` provided by ```<aq-remotedevice/>```.

## Attribute/URL signing

Whenever information such as URLs or attributes are being passed around, it may be necessary to know they have not been tampered with. A web browser must be considered a hostile and adversarial environment.

One of the means available to ensure this data has not been tampered with is to digitally sign it.

Either symetric or asymetric cryptographic algorithms can be used to create and validate digital signatures.

You can use a symetric cryptographic signing algorithm if the party doing the signing and the party needing to verify are the same.

You can use an asymetric cryptographic signing algorithm is the party doing the signing and the party needing to verify are different.

An example using symetric cryptographic signing follows. This is based on the NodeJS npm package ```signed```
```sh
npm install signed
```

```typescript
import signed from 'signed';

// the optional ttl specifies that the signed artifact will be valid for this many seconds after which it will expire
const signature = signed({secret: 'my-super-secret-signing-key', hash: 'sha256', ttl: 60});
const signedUrl = signature.signed('https://my.3rd-party-app.com/api/webhook/issuance/attributes?app_context=user-id-555-1212');

try {
    signature.verify(signedUrl);
}
catch(e) {
    console.error(`request url signature validation failed. ${e.message}`);
}

```


