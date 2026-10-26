# Multi-stage reproducible Emscripten build for Google OR-Tools CP-SAT single-threaded WASM.
# Stage 1: Build OR-Tools static libraries using Emscripten SDK.
FROM emscripten/emsdk:3.1.73 AS build-ortools

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    cmake \
    ninja-build \
    python3 \
    pkg-config \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Clone Google OR-Tools pinned at stable release tag
ARG ORTOOLS_TAG=v9.11
RUN git clone --depth 1 --branch ${ORTOOLS_TAG} https://github.com/google/or-tools.git

WORKDIR /workspace/or-tools

# Configure single-threaded CP-SAT build with external linear/routing subsystems disabled.
# BUILD_SHARED_LIBS=OFF is essential for Emscripten static link.
RUN emcmake cmake -S . -B build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_DEPS=ON \
    -DBUILD_SHARED_LIBS=OFF \
    -DBUILD_TESTING=OFF \
    -DBUILD_EXAMPLES=OFF \
    -DBUILD_SAMPLES=OFF \
    -DBUILD_PYTHON=OFF \
    -DBUILD_JAVA=OFF \
    -DBUILD_DOTNET=OFF \
    -DBUILD_FLATZINC=OFF \
    -DBUILD_MATH_OPT=OFF \
    -DUSE_COINOR=OFF \
    -DUSE_GLPK=OFF \
    -DUSE_HIGHS=OFF \
    -DUSE_PDLP=OFF \
    -DUSE_SCIP=OFF \
    -DORTOOLS_TARGET_OS_SUPPORTS_THREADS=OFF \
    -DCMAKE_CXX_FLAGS="-O3 -flto -sUSE_PTHREADS=0"

# Build core ortools library
RUN cmake --build build --target ortools -j $(nproc)
RUN cmake --install build --prefix /workspace/ortools-install

# Stage 2: Compile the minimal C WASM wrapper exporting SolveProto and FreeBuffer
FROM emscripten/emsdk:3.1.73 AS build-wasm

WORKDIR /workspace/wrapper

COPY --from=build-ortools /workspace/ortools-install /workspace/ortools-install
COPY docker/wasm-solver/solve_proto.cc .
COPY docker/wasm-solver/CMakeLists.txt .

RUN emcmake cmake -S . -B build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_PREFIX_PATH=/workspace/ortools-install

RUN cmake --build build -j $(nproc)

# Stage 3: Verify binary size budget (< 5MB compressed) and package output
FROM alpine:3.20 AS verify

RUN apk add --no-cache gzip brotli

WORKDIR /dist
COPY --from=build-wasm /workspace/wrapper/build/ortools-sat.js .
COPY --from=build-wasm /workspace/wrapper/build/ortools-sat.wasm .

RUN gzip -k -9 ortools-sat.wasm && \
    brotli -k -9 ortools-sat.wasm && \
    ls -lh ortools-sat.* && \
    WASM_GZIP_SIZE=$(stat -c%s ortools-sat.wasm.gz) && \
    echo "Compressed Gzip size: $WASM_GZIP_SIZE bytes" && \
    test $WASM_GZIP_SIZE -lt 5242880 || (echo "ERROR: Compressed binary exceeds 5MB limit!" && exit 1)

# Default output stage
FROM scratch AS export
COPY --from=verify /dist/ortools-sat.wasm /
COPY --from=verify /dist/ortools-sat.js /
