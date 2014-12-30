var superquad = {
   N : 100,
   M : 100,
   n : 3,
   m : 5,
  
   verts : null,
   normals : null,
   texCoords : null,

   power : function(x, y){
      if (x === 0)return 0;
      return Math.pow(Math.abs(x), y);

   },

   //Parametric equations for calculating the vert and normal values of the superellipsoid.
   x : function(m, n, u, v){
      return Math.cos(v)*this.power(Math.cos(v), 2/m-1)*Math.cos(u)*this.power(Math.cos(u), 2/n-1);
   },

   y : function(m, n, u, v){
      return Math.cos(v)*this.power(Math.cos(v), 2/m-1)*Math.sin(u)*this.power(Math.sin(u), 2/n-1);
   },

   z : function(m, v){
      return Math.sin(v)*this.power(Math.sin(v), 2/m-1);
   },

   normx : function(m, n, u, v){
      return Math.cos(v)*this.power(Math.cos(v), 2-2/m-1)*Math.cos(u)*this.power(Math.cos(u), 2-2/n-1);
   },

   normy : function(m, n, u, v){
      return Math.cos(v)*this.power(Math.cos(v), 2-2/m-1)*Math.sin(u)*this.power(Math.sin(u), 2-2/n-1);
   },

   normz : function(m, v){
      return Math.sin(v)*this.power(Math.sin(v), 2-2/m-1);
   },

   createGeometry : function() {
      var N = this.N, M = this.M;
      var numFloats = 3*(N+1)*(M+1);
      var v = -Math.PI/2; u = -Math.PI;
      dv = 2*Math.abs(v)/N, du = 2*Math.PI/M;
      if (!this.verts || this.verts.length != numFloats){
         //the array sizes we should expect
         this.verts = new Float32Array(numFloats);
         this.normals = new Float32Array(numFloats);
         this.texCoords = new Float32Array(2*(N+1)*(M+1));
      }
      var n = 0;
      var m = 0;
      //Main For-Loop used to populate the mesh and normals
      for (var i = 0; i <= N; i++, v+=dv){          
         var u = -Math.PI;
         for (var j = 0; j <= M; j++, u+=du){
            if  (j == M) u = -Math.PI; 
            this.verts[n] = this.x(this.m,this.n,u,v);
            this.verts[n+1] = this.y(this.m,this.n,u,v);
            this.verts[n+2] = this.z(this.m,v);
            this.normals[n] = this.normx(this.m,this.n,u,v);
            this.normals[n+1] = this.normy(this.m,this.n,u,v);
            this.normals[n+2] = this.normz(this.m,v);
            n += 3;

         }
      }//N forloop
   //**START OF PART 3: GETTING NON-UNIFORM VARIABLE SPACING
      var m = 2*(M+1)+2; //this is supposed to match up with the 2nd index of 2nd row of texture array
      var n = 3*(M+1) + 3; //set index counter for vert array to index[1][0] of the verts array if it were 2-d
      for (var i = 1; i < N; i++){ //because N is a special case
         var d = new Float32Array(M+1);
         d[0] = 0; //we know that the 0th point is 0 already in distance array
         
         var d_sum = 0; //sum for the entire row distances
         for (var j = 1; j <= M; j++){ 
            xcom = this.verts[n] - this.verts[n-3];
            ycom = this.verts[n+1] - this.verts[n-2];
            zcom = this.verts[n+2] - this.verts[n-1];
            d[j] = Math.sqrt(xcom*xcom + ycom*ycom + zcom*zcom);
            n += 3;
            d_sum += d[j];   
         }
         //actually calculating the s values now
         for (var w = 1; w <= M; w++){ 
            var p_sum = 0;
            //going through d array and calculating partial sum
            for (var h = 0; h <= w; h++){
               p_sum += d[h];
            }
            var s = p_sum/d_sum;
            this.texCoords[m] = s;
            m += 2;            
         }
         m += 2;
         n += 3;  
      }
   //Copy *S* vals over from row 1 to row 0 and row N-1 to row N
      for (var l = 0; l <= M; l++){
         this.texCoords[2*l] = this.texCoords[(2*(M+1)) + 2*l];
         this.texCoords[N*(2*(M+1)) + 2*l] = this.texCoords[(N-1)*(2*(M+1)) + 2*l]; 
      }
    //**END CALCULATING S VALS**
    //**START CALCULATING T VALS**

      for (var j = 0; j < M; j++){
         var d = new Float32Array(N+1);
         d[0] = 0;
         var d_sum = 0;
         for (var i = 1; i <= N; i++){
   /* calculate the indices without a subroutine because it's not really consistent
      with respect to which values you need to pick between the texture array and verts array
      plus it's really not a lot of calls and the math should be understandable to anyone
      familier with graphics programming */
            var xcom = this.verts[i*3*(M+1)+3*j] - this.verts[(i-1)*3*(M+1)+3*j];
            var ycom = this.verts[i*3*(M+1)+3*j+1] - this.verts[(i-1)*3*(M+1)+3*j+1];
            var zcom = this.verts[i*3*(M+1)+3*j+2] - this.verts[(i-1)*3*(M+1)+3*j+2];
            d[i] = Math.sqrt(xcom*xcom + ycom*ycom + zcom*zcom);
            d_sum += d[i];
         }
         for (var w = 0; w <= N; w++){ 
            var p_sum = 0;
            for (var h = 0; h <= w; h++){
               p_sum += d[h];
            }
            this.texCoords[w*2*(M+1)+(2*j)+1] = p_sum/d_sum; 
         }  
      }
      for (var y = 0; y <= N; y++){
         this.texCoords[y*2*(M+1) + 2*M+1] = this.texCoords[y*2*(M+1)+1];
      }

    //**END CALCULATING NEW S AND T VALS FOR NON-UNIFORM SPACING**      
   },//for createGeometry()

   triangleStrip: null,

   createTriangleStrip : function() {
      var M = this.M, N = this.N;
      var numIndices = N*(2*(M+1)+2)-2;
      if (!this.triangleStrip || this.triangleStrip.length != numIndices){
         this.triangleStrip = new Uint16Array(numIndices);
      } 
      //sub-function should work for this since our mesh is
      //the same size as the torus' one.
      var index = function(i, j){
         return i*(M+1) + j;
      }
      var n = 0;
      //very similar to doing a triangle mesh with a trous but it
      //looks like index(i+1,j) and (i,j) need to be switched around
      //to properly hook up the triangles.
      for (var i = 0; i < N; i++){
         if (i > 0){ //first degenerate point we need (i>0,0)      
            this.triangleStrip[n++] = index(i,0);
         }
         for (var j = 0; j <= M; j++){
            this.triangleStrip[n++] = index(i, j); //triangle points we always need
            this.triangleStrip[n++] = index(i+1,j);
         }
         if (i < N-1){ 
            this.triangleStrip[n++] = index(i,M);//second degerate triangle point we need  
         }
      }
   },//for createTriangleStrip

   wireframe : null,

   //This is naively copied from the createWireFrame() for the torus
   //until I see some inherent difference for doing this for the 2
   //different shapes. Nothing about this in assignment prompt.
   createWireFrame : function() {
      var lines = [];
      lines.push(this.triangleStrip[0], this.triangleStrip[1]);
      var numStripIndices = this.triangleStrip.length;
      for (var i = 2; i < numStripIndices; i++){
         var a = this.triangleStrip[i-2];
         var b = this.triangleStrip[i-1];
         var c = this.triangleStrip[i];
         if (a != b && b != c && c != a){
            lines.push(a, c, b, c);
         }
      this.wireframe = new Uint16Array(lines);    
      }      
   },//for createWireFrame

}; //for entire object
