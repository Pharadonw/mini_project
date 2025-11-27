import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state={hasError:false, err:null}; }
  static getDerivedStateFromError(err){ return {hasError:true, err}; }
  componentDidCatch(err, info){ console.error("UI Error:", err, info); }
  render(){
    if(this.state.hasError){
      return (
        <div style={{padding:16}}>
          <h2>มีข้อผิดพลาดในหน้า</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
