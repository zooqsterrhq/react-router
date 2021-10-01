# Dynamic Routing Example

Sometimes you don't know all the possible routes
for your application up front; for example, when
building a file-system browsing UI or determining
URLs dynamically based on data. In these situations,
it helps to have a dynamic router that is able
to generate routes as needed at runtime.

This example lets you drill down into a friends
list recursively, viewing each user's friend list
along the way. As you drill down, notice each segment
being added to the URL. You can copy/paste this link
to someone else, and they will see the same UI.

Then click the back button and watch the last
segment of the URL disappear along with the last
friend list.

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/dev/examples/dynamic-routes)
