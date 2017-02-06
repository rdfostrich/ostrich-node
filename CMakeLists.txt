cmake_minimum_required(VERSION 3.3)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-deprecated")
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
include("deps/ostrich/ext/hunter/HunterGate.cmake")
HunterGate(
    URL "https://github.com/ruslo/hunter/archive/v0.12.40.tar.gz"
    SHA1 "0ccc3f3fd571676a1804723984598f9f90a4d6bc"
)

# Set project
project(ostrich)

# Include cmake-js requirements
include_directories(${CMAKE_JS_INC})

# Add HDT
include_directories(
        deps/hdt/libcds-v1.0.12/includes/
        deps/ostrich/deps/hdt/hdt-lib/include/
        deps/ostrich/deps/hdt/hdt-lib/src/
)

# Add source files
file(GLOB_RECURSE SOURCE_FILES
        "lib/ostrich.cc",
        "lib/OstrichStore.cc"
        "deps/ostrich/src/main/cpp/*.h"
        "deps/ostrich/src/main/cpp*.cpp"
        "deps/ostrich/deps/hdt/hdt-lib/src/*.h"
        "deps/ostrich/deps/hdt/hdt-lib/src/*.cpp"
)

# Set cmake-js binary
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Add Kyoto Cabinet
find_library(KYOTO_SHARED_LIBRARY kyotocabinet PATHS ${KC_ROOT}/lib)
find_path(KYOTO_INCLUDE_DIR kchashdb.h PATHS ${KC_ROOT}/include)
if (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)
    message("FATAL_ERROR Kyoto Cabinet not found!")
    set(Kyoto-NOTFOUND 1)
    set(Kyoto-FOUND)
else (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)
    if (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
        message("FATAL_ERROR Kyoto Cabinet not found!")
        set(Kyoto-NOTFOUND 1)
        set(Kyoto-FOUND)
    else (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
        set(Kyoto-FOUND 1)
        set(Kyoto-NOTFOUND)
        message(STATUS "Kyoto Cabinet Found")
        # get the static version
        string(REGEX REPLACE "\\${CMAKE_SHARED_LIBRARY_SUFFIX}$" ".a" KYOTO_STATIC_LIBRARY ${KYOTO_SHARED_LIBRARY})
        message(STATUS "Kyoto Cabinet: ${KYOTO_STATIC_LIBRARY}" )
        target_link_libraries(${PROJECT_NAME} ${KYOTO_SHARED_LIBRARY})
        include_directories(${KYOTO_INCLUDE_DIR})
        add_definitions(-DHAS_KYOTO)
    endif (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
endif (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)

if (Kyoto-FOUND)
    add_definitions(-DHAVE_KYOTO)
endif()

# Add pthreads
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
target_link_libraries(${PROJECT_NAME} Threads::Threads)

# Add zlib
hunter_add_package(ZLIB)
find_package(ZLIB CONFIG REQUIRED)
include_directories(${ZLIB_INCLUDE_DIRS})
target_link_libraries(${PROJECT_NAME} ${ZLIB_LIBRARIES})

# Add Boost
hunter_add_package(Boost COMPONENTS iostreams regex)
find_package(Boost CONFIG REQUIRED COMPONENTS iostreams regex)
target_link_libraries(${PROJECT_NAME} Boost::iostreams Boost::regex)

if(NOT MSVC)
    set(PThreadLib -pthread)
endif()