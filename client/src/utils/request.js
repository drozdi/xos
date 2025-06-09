// parameterize :: replace substring in string by template
// parameterize :: Object -> String -> String
// parameterize :: {id: '123'} -> '/todos/:id/show' -> '/todos/123/shows'
export function parameterize (url, urlParameters) {
    return Object.entries(urlParameters)
        .reduce(
            (a, [key, value]) => a.replace(`:${key}`, value),
            url,
        );
}