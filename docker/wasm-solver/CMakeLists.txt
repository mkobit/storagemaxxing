cmake_minimum_required(VERSION 3.22)
project(ortools_wasm LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT EMSCRIPTEN)
  message(FATAL_ERROR "This CMake project must be built with Emscripten (emcmake cmake)")
endif()

find_package(ortools CONFIG REQUIRED)

add_executable(ortools-sat solve_proto.cc)

target_link_libraries(ortools-sat PRIVATE
  ortools::ortools
)

set_target_properties(ortools-sat PROPERTIES
  OUTPUT_NAME "ortools-sat"
  SUFFIX ".js"
)

target_link_options(ortools-sat PRIVATE
  "-O3"
  "-flto"
  "-sUSE_PTHREADS=0"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sINITIAL_MEMORY=33554432"
  "-sMAXIMUM_MEMORY=536870912"
  "-sMODULARIZE=1"
  "-sEXPORT_ES6=1"
  "-sEXPORT_NAME=createOrToolsSatModule"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_SolveProto','_FreeBuffer']"
  "-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','HEAPU8']"
)
