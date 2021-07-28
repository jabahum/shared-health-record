# Shared Health Record
[![Publish Docker image](https://github.com/I-TECH-UW/shared-health-record/actions/workflows/publish.yml/badge.svg)](https://github.com/I-TECH-UW/shared-health-record/actions/workflows/publish.yml)
[![Run Tests](https://github.com/I-TECH-UW/shared-health-record/actions/workflows/test.yml/badge.svg)](https://github.com/I-TECH-UW/shared-health-record/actions/workflows/test.yml)

An FHIR-based Implementation of the Shared Health Record (SHR) as specified in section 3.6 of the [OpenHIE Architecture Specifications](https://ohie.org/framework/).

This project implements the following FHIR IGs:
1. Lab Workflows: https://i-tech-uw.github.io/emr-lis-ig/, https://b-techbw.github.io/bw-lab-ig
2. International Patient Summary: http://hl7.org/fhir/uv/ips/

## Dev Guide

### Local Development
```sh
git clone https://github.com/I-TECH-UW/shared-health-record.git
cd shared-health-record
yarn
yarn build
yarn start
```

### Docker Setup


## References
Supports the [International Patient Summary](http://hl7.org/fhir/uv/ips/)
Supports the [OpenHIE Laboratory Workflows](https://i-tech-uw.github.io/emr-lis-ig/)