function middleware(input: number|http.Server|EngineIO.Server): (req: express.Request, res: express.Response) => void {
  var port = (<number> input); // Create EngineIO.Server listening at port
  var httpServer = (<http.Server> input); // Create EngineIO.Server listening on http.Server
  var socketServer = (<EngineIO.Server> input); // Use existing EngineIO.Server

  return (req, res) => {

  };
}