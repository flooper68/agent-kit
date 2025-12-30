import { Button } from '@agent-kit/ui';

function App() {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <div className="app">
      <h1>Agent Kit Web Application</h1>
      <p>This application uses components from the @agent-kit/ui library:</p>

      <div className="button-showcase">
        <h2>Button Variants</h2>
        <div className="button-row">
          <Button variant="primary" onClick={handleClick}>
            Primary Button
          </Button>
          <Button variant="secondary" onClick={handleClick}>
            Secondary Button
          </Button>
          <Button variant="outline" onClick={handleClick}>
            Outline Button
          </Button>
        </div>

        <h2>Button Sizes</h2>
        <div className="button-row">
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>

        <h2>Disabled State</h2>
        <div className="button-row">
          <Button disabled>Disabled Button</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
